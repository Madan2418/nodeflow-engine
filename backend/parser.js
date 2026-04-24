/**
 * parser.js
 * Input validation, whitespace trimming, self-loop rejection,
 * and exact-once duplicate edge tracking.
 */

const VALID_EDGE_RE = /^[A-Z]->[A-Z]$/;

/**
 * @param {string[]} data  Raw array from request body
 * @returns {{ validEdges: string[], invalidEntries: string[], duplicateEdges: string[] }}
 */
function parseInput(data) {
  const invalidEntries = [];
  const duplicateEdges = [];

  const seenEdges = new Set();        // first occurrence tracker
  const markedDuplicate = new Set();  // prevents pushing same dup more than once
  const validEdges = [];

  for (const raw of data) {
    // 1. Trim whitespace first
    const entry = typeof raw === "string" ? raw.trim() : String(raw).trim();

    // 2. Validate format
    if (!VALID_EDGE_RE.test(entry)) {
      invalidEntries.push(raw); // push original (pre-trim) value as received
      continue;
    }

    // 3. Self-loop check  A->A
    const [parent, child] = entry.split("->"); // safe because regex guarantees format
    if (parent === child) {
      invalidEntries.push(raw);
      continue;
    }

    // 4. Deduplication (exact-once rule)
    if (!seenEdges.has(entry)) {
      seenEdges.add(entry);
      validEdges.push(entry);
    } else if (!markedDuplicate.has(entry)) {
      markedDuplicate.add(entry);
      duplicateEdges.push(entry);
    }
    // 3rd+ occurrence: silently ignored
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

module.exports = { parseInput };
