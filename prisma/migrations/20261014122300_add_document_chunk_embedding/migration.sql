-- Enable pgvector for OpenAI text-embedding-3-small (1536 dimensions).
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN "embedding" vector(1536);
