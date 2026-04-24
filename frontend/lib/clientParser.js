/**
 * clientParser.js
 * Mirrors backend parser.js exactly — used for live validation preview.
 * Same regex, same self-loop check, same dedup logic.
 */

const VALID_EDGE_RE = /^[A-Z]->[A-Z]$/;

export function parseInput(data) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const markedDuplicate = new Set();
  const validEdges = [];

  for (const raw of data) {
    const entry = typeof raw === "string" ? raw.trim() : String(raw).trim();

    if (!VALID_EDGE_RE.test(entry)) {
      invalidEntries.push(raw);
      continue;
    }

    const [parent, child] = entry.split("->");
    if (parent === child) {
      invalidEntries.push(raw);
      continue;
    }

    if (!seenEdges.has(entry)) {
      seenEdges.add(entry);
      validEdges.push(entry);
    } else if (!markedDuplicate.has(entry)) {
      markedDuplicate.add(entry);
      duplicateEdges.push(entry);
    }
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

/**
 * Splits a raw text input (comma-separated, one-per-line, or JSON array)
 * into an array of strings for parsing.
 */
export function splitInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Try JSON array first
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (_) {}
  }

  // Split by comma or newline
  return trimmed
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
