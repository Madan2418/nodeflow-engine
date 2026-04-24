/**
 * graph.js
 * Builds adjacency list + parentOf map from valid edges.
 * Handles diamond (multi-parent) silently — first parent wins.
 * Splits nodes into connected groups via BFS on undirected view.
 * Preserves INPUT-ENCOUNTER ORDER for hierarchies array output.
 */

/**
 * @param {string[]} validEdges   e.g. ["A->B","A->C","B->D"]
 * @returns {{ adjacency, reverseAdjacency, parentOf, allNodesOrdered, groups }}
 */
function buildGraph(validEdges) {
  const adjacency = {};        // parent → [children]
  const reverseAdjacency = {}; // child  → [parents]  (for undirected BFS)
  const parentOf = {};         // child  → its ONE parent (diamond guard)

  // Ordered set — preserves first-encounter order for BFS seeding
  const allNodesOrdered = [];
  const seenNodes = new Set();

  const addNode = (n) => {
    if (!seenNodes.has(n)) {
      seenNodes.add(n);
      allNodesOrdered.push(n);
    }
  };

  for (const edge of validEdges) {
    const [parent, child] = edge.split("->");
    addNode(parent);
    addNode(child);

    // Diamond guard — first-encountered parent wins; subsequent silently discarded
    if (parentOf[child] !== undefined) continue;

    parentOf[child] = parent;

    adjacency[parent] = adjacency[parent] || [];
    adjacency[parent].push(child);

    reverseAdjacency[child] = reverseAdjacency[child] || [];
    reverseAdjacency[child].push(parent);
  }

  // Split into connected components using BFS on undirected view
  const groups = getConnectedGroups(allNodesOrdered, adjacency, reverseAdjacency);

  return { adjacency, reverseAdjacency, parentOf, allNodesOrdered, groups };
}

/**
 * BFS grouping — undirected (follows both forward and reverse edges).
 * Seeds from allNodesOrdered to preserve input-encounter order in output.
 */
function getConnectedGroups(allNodesOrdered, adjacency, reverseAdjacency) {
  const visited = new Set();
  const groups = [];

  for (const startNode of allNodesOrdered) {
    if (visited.has(startNode)) continue;

    const group = [];
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length) {
      const curr = queue.shift();
      group.push(curr);

      const neighbors = [
        ...(adjacency[curr] || []),
        ...(reverseAdjacency[curr] || []),
      ];

      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

module.exports = { buildGraph };
