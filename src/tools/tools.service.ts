import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { summarizeToolInput } from './tool-input';
import { ToolRegistry } from './tool-registry';
import { withToolTimeout } from './tool-timeout';

@Injectable()
export class ToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ToolRegistry,
  ) {}

  async invoke(
    userId: string,
    name: string,
    input: Record<string, unknown>,
  ) {
    const membership = await this.requireMembership(userId);
    const result = await this.execute(
      membership.organizationId,
      userId,
      membership.role,
      name,
      input,
    );

    return {
      tool: name,
      result,
    };
  }

  async execute(
    organizationId: string,
    userId: string,
    role: Role,
    name: string,
    input: Record<string, unknown>,
  ): Promise<unknown> {
    const tool = this.registry.get(name);

    if (!tool) {
      throw new NotFoundException('Tool was not found.');
    }

    if (!tool.allowedRoles.includes(role)) {
      await this.writeAudit(organizationId, userId, name, input, false);
      throw new ForbiddenException(
        'User does not have permission to call this tool.',
      );
    }

    try {
      const result = await withToolTimeout((signal) =>
        tool.run(
          {
            organizationId,
            userId,
            role,
            signal,
          },
          input,
        ),
      );

      await this.writeAudit(organizationId, userId, name, input, true);

      return result;
    } catch (error) {
      await this.writeAudit(organizationId, userId, name, input, false);
      throw error;
    }
  }

  private async requireMembership(userId: string) {
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

    return membership;
  }

  private async writeAudit(
    organizationId: string,
    userId: string,
    toolName: string,
    input: Record<string, unknown>,
    success: boolean,
  ) {
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'TOOL_CALLED',
        resource: toolName,
        metadata: {
          input: summarizeToolInput(input),
          success,
        },
      },
    });
  }
}
