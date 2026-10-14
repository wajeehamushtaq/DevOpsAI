import { RequestTimeoutException } from '@nestjs/common';

import { TOOL_TIMEOUT_MS } from './tool.types';

export async function withToolTimeout<T>(
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOOL_TIMEOUT_MS);

  try {
    return await Promise.race([
      work(controller.signal),
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new RequestTimeoutException('Tool timed out.'));
        });
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
