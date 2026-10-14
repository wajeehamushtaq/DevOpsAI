import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, Role } from '@prisma/client';

import { DocumentsService } from '../documents/documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { ToolsService } from '../tools/tools.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreateIncidentDto } from './dto/create-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly toolsService: ToolsService,
    private readonly workflowsService: WorkflowsService,
  ) {}

  async create(
    userId: string,
    dto: CreateIncidentDto,
  ) {
    /*
     * Find the organization membership of the authenticated user.
     *
     * We NEVER accept organizationId from the client.
     */
    const membership =
      await this.prisma.organizationMember.findFirst({
        where: {
          userId,
        },
        select: {
          id: true,
          organizationId: true,
          role: true,
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'User does not belong to any organization.',
      );
    }

    /*
     * Create the incident using trusted server-side values.
     */
    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,

        severity: dto.severity,
        priority: dto.priority,

        organizationId: membership.organizationId,
        createdById: userId,
      },

      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await this.workflowsService.dispatch({
      workflow: 'notification',
      event: 'incident.created',
      incidentId: incident.id,
      organizationId: membership.organizationId,
      userId,
      payload: {
        title: incident.title,
        severity: incident.severity,
        priority: incident.priority,
      },
    });

    return incident;
  }

  async assign(
    userId: string,
    incidentId: string,
    assignedToId: string,
  ) {
    const membership =
      await this.prisma.organizationMember.findFirst({
        where: {
          userId,
        },
        select: {
          organizationId: true,
          role: true,
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'User does not belong to any organization.',
      );
    }

    if (membership.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'User does not have permission to assign incidents.',
      );
    }

    const incident = await this.prisma.incident.findFirst({
      where: {
        id: incidentId,
        organizationId: membership.organizationId,
      },
      select: {
        id: true,
        assignedToId: true,
        severity: true,
      },
    });

    if (!incident) {
      throw new NotFoundException(
        'Incident was not found.',
      );
    }

    const assigneeMembership =
      await this.prisma.organizationMember.findFirst({
        where: {
          userId: assignedToId,
          organizationId: membership.organizationId,
        },
        select: {
          id: true,
        },
      });

    if (!assigneeMembership) {
      throw new BadRequestException(
        'Assignee is not a member of the organization.',
      );
    }

    const previousAssignedToId = incident.assignedToId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: {
          id: incident.id,
        },
        data: {
          assignedToId,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: membership.organizationId,
          userId,
          action: 'INCIDENT_ASSIGNED',
          resource: 'incident',
          metadata: {
            previousAssignedToId,
            assignedToId,
          },
        },
      });

      return updated;
    });

    await this.workflowsService.dispatch({
      workflow: this.workflowsService.workflowForAssignment(incident.severity),
      event: 'incident.assigned',
      incidentId: updated.id,
      organizationId: membership.organizationId,
      userId,
      payload: {
        severity: incident.severity,
        previousAssignedToId,
        assignedToId,
      },
    });

    return updated;
  }

  async context(userId: string, incidentId: string) {
    const membership =
      await this.prisma.organizationMember.findFirst({
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
        title: true,
        description: true,
      },
    });

    if (!incident) {
      throw new NotFoundException(
        'Incident was not found.',
      );
    }

    return this.documentsService.retrieve(
      membership.organizationId,
      `${incident.title}\n${incident.description}`,
    );
  }

  async investigate(userId: string, incidentId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
      },
      select: {
        organizationId: true,
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'User does not belong to any organization.',
      );
    }

    if (
      membership.role !== Role.ADMIN &&
      membership.role !== Role.ENGINEER
    ) {
      throw new ForbiddenException(
        'User does not have permission to investigate incidents.',
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
        description: true,
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident was not found.');
    }

    const run = await this.prisma.$transaction(async (tx) => {
      const created = await tx.agentRun.create({
        data: {
          organizationId: membership.organizationId,
          incidentId: incident.id,
          agentName: 'incident-investigator',
          status: 'RUNNING',
          input: {
            incidentId: incident.id,
            title: incident.title,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: membership.organizationId,
          userId,
          action: 'INCIDENT_INVESTIGATION_STARTED',
          resource: 'incident',
          metadata: {
            incidentId: incident.id,
            agentRunId: created.id,
          },
        },
      });

      return created;
    });

    const service = incident.title.trim().slice(0, 80) || 'service';
    const steps: { tool: string; input: Record<string, unknown> }[] = [
      {
        tool: 'runbook_search',
        input: {
          query: `${incident.title}\n${incident.description}`,
        },
      },
      {
        tool: 'log_lookup',
        input: {
          query: incident.title,
          service,
        },
      },
      {
        tool: 'deployment_info',
        input: {
          service,
          environment: 'production',
        },
      },
    ];

    const evidence: { tool: string; result: unknown }[] = [];

    try {
      for (const step of steps) {
        const result = await this.toolsService.execute(
          membership.organizationId,
          userId,
          membership.role,
          step.tool,
          step.input,
        );

        evidence.push({
          tool: step.tool,
          result,
        });
      }

      const completed = await this.prisma.agentRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          output: {
            summary: `Investigation of "${incident.title}" finished after runbook, log, and deployment checks.`,
            evidence,
            recommendedNextSteps: [
              'Review the matching runbook steps with the on-call engineer.',
              'Compare the current deployment version with the error window.',
              'Update the incident ticket if customer impact continues.',
            ],
          } as Prisma.InputJsonValue,
        },
      });

      await this.workflowsService.dispatch({
        workflow: 'follow_up',
        event: 'incident.investigation.completed',
        incidentId: incident.id,
        organizationId: membership.organizationId,
        userId,
        payload: {
          agentRunId: completed.id,
          status: completed.status,
        },
      });

      return completed;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Investigation failed.';

      return this.prisma.agentRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          output: {
            error: message,
            evidence,
          } as Prisma.InputJsonValue,
        },
      });
    }
  }
}