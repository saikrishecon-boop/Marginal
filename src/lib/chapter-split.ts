// Splits a coursebook's extracted text into one block per "Chapter N: ..."
// heading, so a single textbook PDF can be bulk-added to the knowledge base
// as several clean, separately-searchable documents instead of one giant one.
//
// Real coursebook PDFs (Cambridge, in particular) repeat "Chapter N: Title"
// as a running header on every page of that chapter, not just once at the
// opening page. The algorithm below was written against and validated on a
// real 296-page Cambridge 9708 coursebook export:
//  1. Collect every line that is ONLY a "Chapter N[:] [Title]" heading.
//  2. Collapse consecutive occurrences of the same chapter number into a
//     single boundary (the repeated running header), keeping the longest
//     title seen (the opening page often has "Chapter 4:" alone, with the
//     full title following on the next line; later pages carry both on one
//     line).
//  3. Drop any resulting segment shorter than MIN_CHAPTER_CHARS and merge it
//     back into the previous chapter, then re-collapse — this removes stray
//     in-text cross references like "...as covered in Chapter 2 (AS Level)."
//     that happen to land at the start of a wrapped line and would otherwise
//     be mistaken for a real heading.
// If fewer than two genuine chapter boundaries are found, the document isn't
// a chaptered coursebook (or the split heuristic doesn't apply) and the
// whole text is returned as a single block.

export type ChapterSplit = { title: string; text: string };

const MIN_CHAPTER_CHARS = 3000;
const MAX_HEADING_LINE_CHARS = 80;

// A heading line is ONLY "Chapter <number>", optionally followed by ":" and
// a short title — nothing else on the line.
const CHAPTER_HEADING = /^Chapter\s+(\d{1,3})\s*:?\s*(.*)$/;

type Marker = { lineIndex: number; number: string; title: string };

function isPlausibleTitle(title: string): boolean {
  if (!title) return true; // heading alone on its line; title follows below
  // Real chapter titles are short, title-cased fragments ("The macroeconomy",
  // "Government macro intervention") — never a sentence. Reject anything
  // that looks like body text that merely happens to start with "Chapter N".
  if (/[.!?]\s/.test(title)) return false;
  if (/^[a-z(){}[\]]/.test(title)) return false;
  return true;
}

function collectMarkers(lines: string[]): Marker[] {
  const markers: Marker[] = [];
  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_HEADING_LINE_CHARS) return;
    const match = CHAPTER_HEADING.exec(trimmed);
    if (!match) return;
    const number = match[1]!;
    const title = (match[2] ?? "").trim();
    if (!isPlausibleTitle(title)) return;
    markers.push({ lineIndex, number, title });
  });
  return markers;
}

/** Merge consecutive markers that repeat the same chapter number. */
function collapseRepeats(markers: Marker[]): Marker[] {
  const collapsed: Marker[] = [];
  for (const marker of markers) {
    const last = collapsed[collapsed.length - 1];
    if (last && last.number === marker.number) {
      if (marker.title.length > last.title.length) last.title = marker.title;
      continue;
    }
    collapsed.push({ ...marker });
  }
  return collapsed;
}

function segmentLength(lines: string[], boundaries: Marker[], index: number): number {
  const start = boundaries[index]!.lineIndex;
  const end = boundaries[index + 1]?.lineIndex ?? lines.length;
  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim().length;
}

/** Drop short (spurious) segments and re-collapse, repeating until stable. */
function pruneShortSegments(lines: string[], initial: Marker[]): Marker[] {
  let boundaries = initial;
  let changed = true;
  let guard = 0;

  while (changed && guard < 200) {
    changed = false;
    guard += 1;
    for (let index = 1; index < boundaries.length; index++) {
      if (segmentLength(lines, boundaries, index) < MIN_CHAPTER_CHARS) {
        boundaries = [...boundaries.slice(0, index), ...boundaries.slice(index + 1)];
        changed = true;
        break;
      }
    }
    if (changed) boundaries = collapseRepeats(boundaries);
  }

  return boundaries;
}

export function splitIntoChapters(text: string, fallbackTitle: string): ChapterSplit[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const markers = collapseRepeats(collectMarkers(lines));

  if (markers.length < 2) {
    return [{ title: fallbackTitle, text: text.trim() }];
  }

  const boundaries = pruneShortSegments(lines, markers);
  if (boundaries.length < 2) {
    return [{ title: fallbackTitle, text: text.trim() }];
  }

  const chapters: ChapterSplit[] = boundaries.map((marker, index) => {
    const end = boundaries[index + 1]?.lineIndex ?? lines.length;
    let title = marker.title;
    let bodyStart = marker.lineIndex + 1;

    // A heading with no title on its own line often has the title as the
    // very next (short, non-heading) line — pull it in rather than leaving
    // the chapter untitled.
    if (!title) {
      const next = lines[marker.lineIndex + 1]?.trim() ?? "";
      if (next && next.length <= MAX_HEADING_LINE_CHARS && !CHAPTER_HEADING.test(next)) {
        title = next;
        bodyStart = marker.lineIndex + 2;
      }
    }

    const body = lines.slice(bodyStart, end).join("\n").trim();
    return {
      title: `Chapter ${marker.number}${title ? `: ${title}` : ""}`,
      text: body,
    };
  });

  return chapters.length >= 2 ? chapters : [{ title: fallbackTitle, text: text.trim() }];
}
