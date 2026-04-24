const { buildGraph } = require("../graph");

describe("graph.js", () => {
  // ── Adjacency ────────────────────────────────────────────────────────────
  test("builds adjacency list correctly", () => {
    const { adjacency } = buildGraph(["A->B", "A->C", "B->D"]);
    expect(adjacency["A"]).toEqual(expect.arrayContaining(["B", "C"]));
    expect(adjacency["B"]).toEqual(["D"]);
    expect(adjacency["C"]).toBeUndefined();
  });

  // ── Root detection ───────────────────────────────────────────────────────
  test("correctly identifies roots (nodes never appearing as child)", () => {
    const { parentOf, allNodesOrdered } = buildGraph(["A->B", "A->C", "B->D"]);
    const childSet = new Set(Object.keys(parentOf));
    const roots = allNodesOrdered.filter(n => !childSet.has(n));
    expect(roots).toContain("A");
    expect(roots).not.toContain("B");
    expect(roots).not.toContain("D");
  });

  // ── Diamond / multi-parent ───────────────────────────────────────────────
  test("first-encountered parent wins in diamond case", () => {
    const { parentOf, adjacency } = buildGraph(["A->D", "B->D"]);
    expect(parentOf["D"]).toBe("A");
    expect(adjacency["A"]).toContain("D");
    expect(adjacency["B"]).toBeUndefined(); // B->D silently discarded
  });

  test("silently discarded diamond edge does NOT go to invalid or duplicate", () => {
    // buildGraph only returns adjacency/parentOf, caller checks invalids via parser
    // This tests that adjacency["B"] is undefined (edge dropped silently)
    const { adjacency } = buildGraph(["A->D", "B->D"]);
    expect(adjacency["B"]).toBeUndefined();
  });

  // ── Connected groups ─────────────────────────────────────────────────────
  test("splits two independent trees into separate groups", () => {
    const { groups } = buildGraph(["A->B", "X->Y"]);
    expect(groups).toHaveLength(2);
    const flat = groups.map(g => g.sort().join(",")).sort();
    expect(flat).toEqual(["A,B", "X,Y"]);
  });

  test("cycle nodes are grouped together", () => {
    const { groups } = buildGraph(["X->Y", "Y->Z", "Z->X"]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual(expect.arrayContaining(["X", "Y", "Z"]));
  });

  // ── Input-encounter order ────────────────────────────────────────────────
  test("allNodesOrdered preserves first-encounter order", () => {
    const { allNodesOrdered } = buildGraph(["C->D", "A->B"]);
    expect(allNodesOrdered.indexOf("C")).toBeLessThan(allNodesOrdered.indexOf("A"));
  });

  test("groups are seeded in input-encounter order", () => {
    const { groups } = buildGraph(["P->Q", "A->B"]);
    // P appears first, so P's group should come first
    expect(groups[0]).toContain("P");
    expect(groups[1]).toContain("A");
  });
});
