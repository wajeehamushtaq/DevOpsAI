import { BadRequestException, RequestTimeoutException } from '@nestjs/common';

const SECRET_KEY = /password|secret|token|authorization|api[-_]?key|credential/i;

export function requireString(
  input: Record<string, unknown>,
  field: string,
): string {
  const value = input[field];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

export function optionalString(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  if (input[field] === undefined) {
    return undefined;
  }

  return requireString(input, field);
}

export function summarizeToolInput(
  input: Record<string, unknown>,
): Record<string, string> {
  const summary: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    if (SECRET_KEY.test(key)) {
      continue;
    }

    if (typeof value !== 'string') {
      continue;
    }

    summary[key] = value.slice(0, 200);
  }

  return summary;
}

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new RequestTimeoutException('Tool timed out.');
  }
}
