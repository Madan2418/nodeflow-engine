const { buildBfhlPayload } = require("../pipeline");

describe("pipeline.js", () => {
  test("builds the exact response shape for the spec example", () => {
    const payload = buildBfhlPayload([
      "A->B", "A->C", "B->D", "C->E", "E->F",
      "X->Y", "Y->Z", "Z->X",
      "P->Q", "Q->R",
      "G->H", "G->H", "G->I",
      "hello", "1->2", "A->",
    ]);

    expect(payload).toEqual({
      user_id: "madankumarsenthilkumar_24112005",
      email_id: "ms0585@srmist.edu.in",
      college_roll_number: "RA2311003010658",
      hierarchies: [
        {
          root: "A",
          tree: { A: { B: { D: {} }, C: { E: { F: {} } } } },
          depth: 4,
        },
        {
          root: "X",
          tree: {},
          has_cycle: true,
        },
        {
          root: "P",
          tree: { P: { Q: { R: {} } } },
          depth: 3,
        },
        {
          root: "G",
          tree: { G: { H: {}, I: {} } },
          depth: 2,
        },
      ],
      invalid_entries: ["hello", "1->2", "A->"],
      duplicate_edges: ["G->H"],
      summary: {
        total_trees: 3,
        total_cycles: 1,
        largest_tree_root: "A",
      },
    });
  });

  test("keeps tree and cycle fields evaluator-safe", () => {
    const payload = buildBfhlPayload(["A->B", "X->Y", "Y->X"]);
    const tree = payload.hierarchies.find((item) => item.root === "A");
    const cycle = payload.hierarchies.find((item) => item.root === "X");

    expect(Object.prototype.hasOwnProperty.call(tree, "has_cycle")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(cycle, "depth")).toBe(false);
    expect(tree.tree).toEqual({ A: { B: {} } });
    expect(cycle.tree).toEqual({});
  });
});
