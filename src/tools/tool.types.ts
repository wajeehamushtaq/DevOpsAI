import { Role } from '@prisma/client';

export const TOOL_TIMEOUT_MS = 5_000;

export const TOOL_NAMES = [
  'log_lookup',
  'runbook_search',
  'deployment_info',
  'ticketing',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export interface ToolContext {
  organizationId: string;
  userId: string;
  role: Role;
  signal: AbortSignal;
}

export interface ToolDefinition {
  name: ToolName;
  allowedRoles: Role[];
  run(context: ToolContext, input: Record<string, unknown>): Promise<unknown>;
}
