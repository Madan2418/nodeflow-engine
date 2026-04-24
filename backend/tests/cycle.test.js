const { groupHasCycle } = require("../cycle");

describe("cycle.js", () => {
  // ── No cycle ─────────────────────────────────────────────────────────────
  test("returns false for simple linear tree A->B->C", () => {
    const adjacency = { A: ["B"], B: ["C"] };
    expect(groupHasCycle(["A", "B", "C"], adjacency)).toBe(false);
  });

  test("returns false for a branching tree", () => {
    const adjacency = { A: ["B", "C"], B: ["D"] };
    expect(groupHasCycle(["A", "B", "C", "D"], adjacency)).toBe(false);
  });

  test("returns false for a single node with no edges", () => {
    expect(groupHasCycle(["A"], {})).toBe(false);
  });

  // ── Cycle detected ───────────────────────────────────────────────────────
  test("returns true for a pure 3-node cycle X->Y->Z->X", () => {
    const adjacency = { X: ["Y"], Y: ["Z"], Z: ["X"] };
    expect(groupHasCycle(["X", "Y", "Z"], adjacency)).toBe(true);
  });

  test("returns true for a 2-node cycle A->B->A", () => {
    const adjacency = { A: ["B"], B: ["A"] };
    expect(groupHasCycle(["A", "B"], adjacency)).toBe(true);
  });

  test("returns true for a self-loop (should be filtered by parser, but guard here)", () => {
    const adjacency = { A: ["A"] };
    expect(groupHasCycle(["A"], adjacency)).toBe(true);
  });

  // ── Back-edge vs cross-edge ──────────────────────────────────────────────
  test("does NOT false-positive on a diamond (cross-edge, not cycle)", () => {
    // A->B, A->C, B->D, C->D — D is reachable from two paths but no cycle
    // After diamond guard, only A->D via first parent wins — but cycle check
    // operates on the adjacency AFTER diamond guard, so B->D or C->D is dropped
    // Simulate post-diamond adjacency: A->[B,C], B->[D]  (C->D silently dropped)
    const adjacency = { A: ["B", "C"], B: ["D"] };
    expect(groupHasCycle(["A", "B", "C", "D"], adjacency)).toBe(false);
  });

  test("does NOT false-positive when a node is visited via two paths (no cycle)", () => {
    // A->B, B->C, A->C  — C is visited twice via different paths
    const adjacency = { A: ["B", "C"], B: ["C"] };
    expect(groupHasCycle(["A", "B", "C"], adjacency)).toBe(false);
  });
});
