// Structure-aware chunking: split on headings and paragraph boundaries first,
// then pack into overlapping windows so retrieval returns focused, readable
// passages instead of arbitrary character slices.

const TARGET_CHARS = 1200;
const OVERLAP_CHARS = 180;
const MIN_CHARS = 120;

export type Chunk = {
  index: number;
  content: string;
  heading: string | null;
  tokenEstimate: number;
};

const HEADING_PATTERN =
  /^(?:#{1,6}\s+.+|\d+(?:\.\d+)*\s+\S.*|[A-Z][A-Z0-9 ,'&()/-]{6,}|(?:Chapter|Section|Unit|Topic|Question)\s+\d+.*)$/;

function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 120) return false;
  return HEADING_PATTERN.test(trimmed);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Split raw document text into heading-aware, overlapping chunks. */
export function chunkText(raw: string): Chunk[] {
  const normalised = raw.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (normalised.length === 0) return [];

  // Group the document into sections that each carry their nearest heading.
  const sections: { heading: string | null; body: string[] }[] = [];
  let current: { heading: string | null; body: string[] } = { heading: null, body: [] };

  for (const line of normalised.split("\n")) {
    if (isHeading(line)) {
      if (current.body.join("").trim().length > 0) sections.push(current);
      current = { heading: line.trim().replace(/^#+\s*/, ""), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.join("").trim().length > 0 || current.heading) sections.push(current);

  const chunks: Chunk[] = [];

  for (const section of sections) {
    const paragraphs = section.body
      .join("\n")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);

    let buffer = "";

    const flush = () => {
      const content = buffer.trim();
      buffer = "";
      if (content.length === 0) return;
      if (content.length < MIN_CHARS && chunks.length > 0) {
        // Fold a tiny trailing fragment back into the previous chunk rather
        // than emitting a chunk too small to retrieve meaningfully.
        const previous = chunks[chunks.length - 1];
        previous.content = `${previous.content}\n\n${content}`;
        previous.tokenEstimate = estimateTokens(previous.content);
        return;
      }
      chunks.push({
        index: chunks.length,
        content,
        heading: section.heading,
        tokenEstimate: estimateTokens(content),
      });
    };

    for (const paragraph of paragraphs) {
      // A single oversized paragraph is hard-split on sentence boundaries.
      if (paragraph.length > TARGET_CHARS * 1.6) {
        flush();
        const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [paragraph];
        for (const sentence of sentences) {
          if (buffer.length + sentence.length > TARGET_CHARS) flush();
          buffer += sentence;
        }
        flush();
        continue;
      }

      if (buffer.length + paragraph.length > TARGET_CHARS && buffer.length > 0) {
        const tail = buffer.slice(-OVERLAP_CHARS);
        flush();
        buffer = `${tail}\n\n`;
      }
      buffer += `${paragraph}\n\n`;
    }

    flush();
  }

  return chunks.map((chunk, position) => ({ ...chunk, index: position }));
}

/** Stable fingerprint of document text, used for duplicate detection. */
export async function contentHash(text: string): Promise<string> {
  const normalised = text.replace(/\s+/g, " ").trim().toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalised));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}