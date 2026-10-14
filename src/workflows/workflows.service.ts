import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IncidentSeverity, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type WorkflowName =
  | 'notification'
  | 'escalation'
  | 'ticket'
  | 'follow_up';

const WEBHOOK_TIMEOUT_MS = 5000;

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async dispatch(input: {
    workflow: WorkflowName;
    event: string;
    incidentId: string;
    organizationId: string;
    userId?: string;
    payload: Prisma.InputJsonValue;
  }): Promise<void> {
    const webhookUrl = this.configService.get<string>('N8N_WEBHOOK_URL');

    if (!webhookUrl) {
      await this.writeAudit(input, 'WORKFLOW_SKIPPED', {
        reason: 'N8N_WEBHOOK_URL is not set',
      });
      return;
    }

    const body = {
      workflow: input.workflow,
      event: input.event,
      incidentId: input.incidentId,
      organizationId: input.organizationId,
      payload: input.payload,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.writeAudit(input, 'WORKFLOW_FAILED', {
          status: response.status,
        });
        return;
      }

      await this.writeAudit(input, 'WORKFLOW_DISPATCHED');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Workflow request failed.';

      await this.writeAudit(input, 'WORKFLOW_FAILED', {
        error: message,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async requestTicket(userId: string, incidentId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
      },
      select: {
        organizationId: true,
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'User does not belong to any organization.',
      );
    }

    const incident = await this.prisma.incident.findFirst({
      where: {
        id: incidentId,
        organizationId: membership.organizationId,
      },
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident was not found.');
    }

    await this.dispatch({
      workflow: 'ticket',
      event: 'incident.ticket.requested',
      incidentId: incident.id,
      organizationId: membership.organizationId,
      userId,
      payload: incident,
    });

    return {
      incidentId: incident.id,
      workflow: 'ticket' as const,
      event: 'incident.ticket.requested' as const,
    };
  }

  workflowForAssignment(severity: IncidentSeverity): WorkflowName {
    if (
      severity === IncidentSeverity.HIGH ||
      severity === IncidentSeverity.CRITICAL
    ) {
      return 'escalation';
    }

    return 'notification';
  }

  private async writeAudit(
    input: {
      workflow: WorkflowName;
      event: string;
      incidentId: string;
      organizationId: string;
      userId?: string;
    },
    action: 'WORKFLOW_SKIPPED' | 'WORKFLOW_FAILED' | 'WORKFLOW_DISPATCHED',
    extra?: Record<string, Prisma.InputJsonValue>,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action,
          resource: 'workflow',
          metadata: {
            workflow: input.workflow,
            event: input.event,
            incidentId: input.incidentId,
            ...extra,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write ${action} audit log for incident ${input.incidentId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
