/**
 * edge-cases.test.js
 * Full-pipeline integration tests using the spec example + tricky edge cases.
 * Tests the complete POST /bfhl response shape.
 */

const { parseInput }    = require("../parser");
const { buildGraph }    = require("../graph");
const { groupHasCycle } = require("../cycle");
const { buildTree, calcDepth } = require("../tree");
const { buildSummary }  = require("../summary");

/** Run the full pipeline and return the hierarchies + summary */
function runPipeline(data) {
  const { validEdges, invalidEntries, duplicateEdges } = parseInput(data);
  const { adjacency, parentOf, groups } = buildGraph(validEdges);

  const hierarchies = [];
  for (const groupNodes of groups) {
    const childSet = new Set(Object.keys(parentOf));
    const roots = groupNodes.filter(n => !childSet.has(n));
    const hasCycle = groupHasCycle(groupNodes, adjacency);

    if (hasCycle) {
      const root = roots.length > 0
        ? [...roots].sort()[0]
        : [...groupNodes].sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      for (const root of [...roots].sort()) {
        const tree = { [root]: buildTree(root, adjacency) };
        const depth = calcDepth(root, adjacency);
        hierarchies.push({ root, tree, depth });
      }
    }
  }

  const summary = buildSummary(hierarchies);
  return { hierarchies, invalidEntries, duplicateEdges, summary };
}

// ── Spec example (full) ──────────────────────────────────────────────────────
describe("Spec example — full pipeline", () => {
  const input = [
    "A->B","A->C","B->D","C->E","E->F",
    "X->Y","Y->Z","Z->X",
    "P->Q","Q->R",
    "G->H","G->H","G->I",
    "hello","1->2","A->"
  ];
  let result;
  beforeAll(() => { result = runPipeline(input); });

  test("invalid_entries contains hello, 1->2, A->", () => {
    expect(result.invalidEntries).toEqual(expect.arrayContaining(["hello","1->2","A->"]));
    expect(result.invalidEntries).toHaveLength(3);
  });

  test("duplicate_edges contains G->H exactly once", () => {
    expect(result.duplicateEdges).toEqual(["G->H"]);
  });

  test("produces 4 hierarchy objects", () => {
    expect(result.hierarchies).toHaveLength(4);
  });

  test("tree A has depth 4", () => {
    const a = result.hierarchies.find(h => h.root === "A");
    expect(a).toBeDefined();
    expect(a.depth).toBe(4);
    expect(a.has_cycle).toBeUndefined(); // must NOT be present
  });

  test("X group is a cycle with tree: {}", () => {
    const x = result.hierarchies.find(h => h.root === "X");
    expect(x).toBeDefined();
    expect(x.has_cycle).toBe(true);
    expect(x.tree).toEqual({});
    expect(x.depth).toBeUndefined(); // must NOT be present
  });

  test("tree P has depth 3", () => {
    const p = result.hierarchies.find(h => h.root === "P");
    expect(p.depth).toBe(3);
  });

  test("tree G has depth 2 with I as child", () => {
    const g = result.hierarchies.find(h => h.root === "G");
    expect(g.depth).toBe(2);
    expect(g.tree.G).toHaveProperty("I");
  });

  test("summary: total_trees=3, total_cycles=1, largest_tree_root=A", () => {
    expect(result.summary).toEqual({
      total_trees: 3,
      total_cycles: 1,
      largest_tree_root: "A",
    });
  });
});

// ── Pure cycle lex root ───────────────────────────────────────────────────────
describe("Pure cycle — lex-smallest root", () => {
  test("C->A->B->C cycle picks A as root (lex smallest)", () => {
    const { hierarchies } = runPipeline(["C->A","A->B","B->C"]);
    expect(hierarchies).toHaveLength(1);
    expect(hierarchies[0].root).toBe("A");
    expect(hierarchies[0].has_cycle).toBe(true);
  });

  test("Z->Y->X->Z cycle picks X as root (lex smallest)", () => {
    const { hierarchies } = runPipeline(["Z->Y","Y->X","X->Z"]);
    expect(hierarchies[0].root).toBe("X");
  });
});

// ── Depth — node count, not edge count ───────────────────────────────────────
describe("Depth calculation — nodes not edges", () => {
  test("A->B->C has depth 3 (three nodes)", () => {
    const { hierarchies } = runPipeline(["A->B","B->C"]);
    expect(hierarchies[0].depth).toBe(3);
  });

  test("single root with no children has depth 1", () => {
    // A->B: root A, leaf B → depth 2
    const { adjacency } = buildGraph(["A->B"]);
    expect(calcDepth("A", adjacency)).toBe(2);
    expect(calcDepth("B", adjacency)).toBe(1);
  });
});

// ── Summary tiebreak ─────────────────────────────────────────────────────────
describe("Summary — largest_tree_root tiebreak", () => {
  test("lex smaller root wins when depth is equal", () => {
    // A->B (depth 2) and Z->Y (depth 2) → A wins
    const { summary } = runPipeline(["Z->Y","A->B"]);
    expect(summary.largest_tree_root).toBe("A");
  });
});

// ── Diamond / multi-parent ───────────────────────────────────────────────────
describe("Diamond (multi-parent) handling", () => {
  test("second parent edge is silently discarded — not in invalid or dup", () => {
    const { invalidEntries, duplicateEdges } = runPipeline(["A->D","B->D"]);
    expect(invalidEntries).toHaveLength(0);
    expect(duplicateEdges).toHaveLength(0);
  });

  test("first-encountered parent A wins over B for node D", () => {
    const { hierarchies } = runPipeline(["A->D","B->D","A->C"]);
    const a = hierarchies.find(h => h.root === "A");
    expect(a.tree.A).toHaveProperty("D");
    const b = hierarchies.find(h => h.root === "B");
    // B->D was silently discarded so B has no children → B is a root with depth 1
    expect(b).toBeDefined();
    expect(b.tree.B).toEqual({});
  });
});

// ── Response field rules ─────────────────────────────────────────────────────
describe("Strict response format rules", () => {
  test("non-cyclic tree NEVER has has_cycle field", () => {
    const { hierarchies } = runPipeline(["A->B"]);
    const h = hierarchies.find(h => h.root === "A");
    expect(Object.prototype.hasOwnProperty.call(h, "has_cycle")).toBe(false);
  });

  test("cyclic group NEVER has depth field", () => {
    const { hierarchies } = runPipeline(["A->B","B->A"]);
    const h = hierarchies.find(h => h.has_cycle);
    expect(Object.prototype.hasOwnProperty.call(h, "depth")).toBe(false);
  });

  test("tree field is always present (empty object for cycles)", () => {
    const { hierarchies } = runPipeline(["A->B","B->A"]);
    for (const h of hierarchies) {
      expect(h).toHaveProperty("tree");
    }
  });

  test("summary always has all three sub-fields even if zero", () => {
    const { summary } = runPipeline(["A->B","B->A"]);
    expect(summary).toHaveProperty("total_trees");
    expect(summary).toHaveProperty("total_cycles");
    expect(summary).toHaveProperty("largest_tree_root");
  });
});
