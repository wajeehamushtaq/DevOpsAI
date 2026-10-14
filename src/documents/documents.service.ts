import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { chunkText } from './chunk-text';
import { CreateDocumentDto } from './dto/create-document.dto';
import { EmbeddingsService } from './embeddings.service';

export interface RetrievedChunk {
  content: string;
  title: string;
  score: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  async create(userId: string, dto: CreateDocumentDto) {
    const membership = await this.requireMembership(userId);
    const chunks = chunkText(dto.content);

    if (chunks.length === 0) {
      throw new BadRequestException('Document content is empty.');
    }

    const vectors = await this.embeddings.embed(chunks);

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          title: dto.title,
          content: dto.content,
          source: dto.source,
          organizationId: membership.organizationId,
        },
      });

      for (const [chunkIndex, content] of chunks.entries()) {
        const embedding = toVectorLiteral(vectors[chunkIndex]);

        await tx.$executeRaw`
          INSERT INTO "DocumentChunk" (
            "id",
            "documentId",
            "content",
            "chunkIndex",
            "embedding",
            "createdAt"
          )
          VALUES (
            ${randomUUID()},
            ${document.id},
            ${content},
            ${chunkIndex},
            ${embedding}::vector,
            NOW()
          )
        `;
      }

      return document;
    });
  }

  async search(userId: string, query: string) {
    const membership = await this.requireMembership(userId);

    return this.retrieve(membership.organizationId, query);
  }

  async retrieve(
    organizationId: string,
    query: string,
  ): Promise<RetrievedChunk[]> {
    const text = query.trim();

    if (!text) {
      throw new BadRequestException('Search query is empty.');
    }

    const [vector] = await this.embeddings.embed([text]);
    const embedding = toVectorLiteral(vector);

    const rows = await this.prisma.$queryRaw<
      { content: string; title: string; score: number }[]
    >`
      SELECT
        c."content" AS "content",
        d."title" AS "title",
        1 - (c."embedding" <=> ${embedding}::vector) AS "score"
      FROM "DocumentChunk" c
      INNER JOIN "Document" d ON d."id" = c."documentId"
      WHERE d."organizationId" = ${organizationId}
        AND c."embedding" IS NOT NULL
      ORDER BY c."embedding" <=> ${embedding}::vector
      LIMIT 5
    `;

    return rows.map((row) => ({
      content: row.content,
      title: row.title,
      score: Number(row.score),
    }));
  }

  private async requireMembership(userId: string) {
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

    return membership;
  }
}

function toVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}
