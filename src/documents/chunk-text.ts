const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

export function chunkText(content: string): string[] {
  const text = content.trim();

  if (!text) {
    return [];
  }

  const chunks: string[] = [];
  const step = CHUNK_SIZE - CHUNK_OVERLAP;

  for (let start = 0; start < text.length; start += step) {
    chunks.push(text.slice(start, start + CHUNK_SIZE));

    if (start + CHUNK_SIZE >= text.length) {
      break;
    }
  }

  return chunks;
}
