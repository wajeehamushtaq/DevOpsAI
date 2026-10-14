import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

import { DocumentsService } from '../documents/documents.service';
import {
  optionalString,
  requireString,
  throwIfAborted,
} from './tool-input';
import { ToolDefinition, ToolName } from './tool.types';

const OPERATOR_ROLES = [Role.ADMIN, Role.ENGINEER];

@Injectable()
export class ToolRegistry {
  private readonly tools: Map<ToolName, ToolDefinition>;

  constructor(private readonly documentsService: DocumentsService) {
    const definitions: ToolDefinition[] = [
      {
        name: 'log_lookup',
        allowedRoles: OPERATOR_ROLES,
        run: async (context, input) => {
          throwIfAborted(context.signal);
          const query = requireString(input, 'query');
          const service = optionalString(input, 'service') ?? 'api';

          return {
            service,
            query,
            entries: [
              {
                timestamp: '2026-10-14T07:12:03Z',
                level: 'error',
                message: `Timeout while handling "${query}" on ${service}`,
              },
              {
                timestamp: '2026-10-14T07:12:11Z',
                level: 'warn',
                message: `${service} retry budget exhausted`,
              },
            ],
          };
        },
      },
      {
        name: 'runbook_search',
        allowedRoles: [Role.ADMIN, Role.ENGINEER, Role.VIEWER],
        run: async (context, input) => {
          throwIfAborted(context.signal);
          const query = requireString(input, 'query');
          const chunks = await this.documentsService.retrieve(
            context.organizationId,
            query,
          );

          throwIfAborted(context.signal);

          return { query, chunks };
        },
      },
      {
        name: 'deployment_info',
        allowedRoles: OPERATOR_ROLES,
        run: async (context, input) => {
          throwIfAborted(context.signal);
          const service = requireString(input, 'service');
          const environment = optionalString(input, 'environment') ?? 'production';

          return {
            service,
            environment,
            version: '1.4.2',
            deployedAt: '2026-10-14T06:40:00Z',
            status: 'degraded',
          };
        },
      },
      {
        name: 'ticketing',
        allowedRoles: OPERATOR_ROLES,
        run: async (context, input) => {
          throwIfAborted(context.signal);
          const ticketId = requireString(input, 'ticketId');

          return {
            ticketId,
            status: 'open',
            priority: 'P2',
            assignee: 'oncall',
          };
        },
      },
    ];

    this.tools = new Map(definitions.map((tool) => [tool.name, tool]));
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name as ToolName);
  }
}
