// Ported from the original Python ExaminerAgent JSON handling.
// Models occasionally wrap or trail JSON with prose; recover the first
// complete, balanced object rather than failing the whole grading call.

export function extractFirstJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();

  try {
    const direct = JSON.parse(trimmed) as unknown;
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct as Record<string, unknown>;
    }
  } catch {
    // fall through to scanning
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const haystack = fenced ? fenced[1].trim() : trimmed;

  for (let start = 0; start < haystack.length; start++) {
    if (haystack[start] !== "{") continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let end = start; end < haystack.length; end++) {
      const char = haystack[end];

      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }

      if (char === '"') inString = true;
      else if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth === 0) {
          try {
            const parsed = JSON.parse(haystack.slice(start, end + 1)) as unknown;
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              return parsed as Record<string, unknown>;
            }
          } catch {
            // Not a valid object starting here — try the next `{`.
          }
          break;
        }
      }
    }
  }

  throw new Error("The examiner returned a response that could not be read as valid JSON.");
}