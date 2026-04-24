const { parseInput } = require("../parser");

describe("parser.js", () => {
  // ── Valid format ────────────────────────────────────────────────────────
  test("accepts valid single-uppercase-letter edges", () => {
    const { validEdges } = parseInput(["A->B", "C->D"]);
    expect(validEdges).toEqual(["A->B", "C->D"]);
  });

  test("trims whitespace before validating", () => {
    const { validEdges, invalidEntries } = parseInput([" A->B ", "  C->D"]);
    expect(validEdges).toEqual(["A->B", "C->D"]);
    expect(invalidEntries).toHaveLength(0);
  });

  // ── Invalid formats ──────────────────────────────────────────────────────
  test("rejects non-node strings", () => {
    const { invalidEntries } = parseInput(["hello"]);
    expect(invalidEntries).toContain("hello");
  });

  test("rejects numeric nodes", () => {
    const { invalidEntries } = parseInput(["1->2"]);
    expect(invalidEntries).toContain("1->2");
  });

  test("rejects multi-char parent", () => {
    const { invalidEntries } = parseInput(["AB->C"]);
    expect(invalidEntries).toContain("AB->C");
  });

  test("rejects wrong separator", () => {
    const { invalidEntries } = parseInput(["A-B"]);
    expect(invalidEntries).toContain("A-B");
  });

  test("rejects missing child", () => {
    const { invalidEntries } = parseInput(["A->"]);
    expect(invalidEntries).toContain("A->");
  });

  test("rejects empty string", () => {
    const { invalidEntries } = parseInput([""]);
    expect(invalidEntries).toContain("");
  });

  test("rejects lowercase letters", () => {
    const { invalidEntries } = parseInput(["a->b"]);
    expect(invalidEntries).toContain("a->b");
  });

  // ── Self-loop ────────────────────────────────────────────────────────────
  test("rejects self-loop A->A as invalid (not duplicate)", () => {
    const { invalidEntries, duplicateEdges } = parseInput(["A->A"]);
    expect(invalidEntries).toContain("A->A");
    expect(duplicateEdges).toHaveLength(0);
  });

  // ── Deduplication ────────────────────────────────────────────────────────
  test("uses first occurrence of duplicate edge for graph", () => {
    const { validEdges } = parseInput(["A->B", "A->B"]);
    expect(validEdges).toEqual(["A->B"]);
  });

  test("pushes duplicate to duplicate_edges exactly once (3 occurrences)", () => {
    const { duplicateEdges } = parseInput(["A->B", "A->B", "A->B"]);
    expect(duplicateEdges).toEqual(["A->B"]);
  });

  test("handles multiple distinct duplicates", () => {
    const { duplicateEdges } = parseInput(["A->B", "C->D", "A->B", "C->D"]);
    expect(duplicateEdges).toEqual(["A->B", "C->D"]);
  });

  // ── Mixed input ──────────────────────────────────────────────────────────
  test("separates valid, invalid, and duplicates correctly", () => {
    const { validEdges, invalidEntries, duplicateEdges } = parseInput([
      "A->B", "A->B", "hello", "C->D"
    ]);
    expect(validEdges).toEqual(["A->B", "C->D"]);
    expect(invalidEntries).toEqual(["hello"]);
    expect(duplicateEdges).toEqual(["A->B"]);
  });

  test("handles empty array input", () => {
    const result = parseInput([]);
    expect(result.validEdges).toHaveLength(0);
    expect(result.invalidEntries).toHaveLength(0);
    expect(result.duplicateEdges).toHaveLength(0);
  });
});
