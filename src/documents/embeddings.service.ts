import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const EMBEDDING_MODEL = 'text-embedding-3-small';

@Injectable()
export class EmbeddingsService {
  constructor(private readonly configService: ConfigService) {}

  async embed(inputs: string[]): Promise<number[][]> {
    if (inputs.length === 0) {
      return [];
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Embedding service is unavailable.',
      );
    }

    let response: Response;

    try {
      response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: inputs,
        }),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Embedding service is unavailable.',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Embedding service is unavailable.',
      );
    }

    const body = (await response.json()) as {
      data?: { index: number; embedding: number[] }[];
    };

    const vectors = [...(body.data ?? [])].sort(
      (left, right) => left.index - right.index,
    );

    if (
      vectors.length !== inputs.length ||
      vectors.some((item) => !item.embedding?.length)
    ) {
      throw new ServiceUnavailableException(
        'Embedding service is unavailable.',
      );
    }

    return vectors.map((item) => item.embedding);
  }
}
