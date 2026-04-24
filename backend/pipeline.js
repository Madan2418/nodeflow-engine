const { USER_ID, EMAIL_ID, COLLEGE_ROLL_NUMBER } = require("./constants");
const { parseInput } = require("./parser");
const { buildGraph } = require("./graph");
const { groupHasCycle } = require("./cycle");
const { buildTree, calcDepth } = require("./tree");
const { buildSummary } = require("./summary");

function buildHierarchies(validEdges) {
  const { adjacency, parentOf, groups } = buildGraph(validEdges);
  const childSet = new Set(Object.keys(parentOf));
  const hierarchies = [];

  for (const groupNodes of groups) {
    const roots = groupNodes.filter((node) => !childSet.has(node));
    const hasCycle = groupHasCycle(groupNodes, adjacency);

    if (hasCycle) {
      const root = roots.length > 0 ? [...roots].sort()[0] : [...groupNodes].sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
      continue;
    }

    for (const root of [...roots].sort()) {
      const tree = { [root]: buildTree(root, adjacency) };
      const depth = calcDepth(root, adjacency);
      hierarchies.push({ root, tree, depth });
    }
  }

  return hierarchies;
}

function buildBfhlPayload(data) {
  const { validEdges, invalidEntries, duplicateEdges } = parseInput(data);
  const hierarchies = buildHierarchies(validEdges);
  const summary = buildSummary(hierarchies);

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary,
  };
}

module.exports = { buildHierarchies, buildBfhlPayload };
