/**
 * cycle.js
 * DFS-based cycle detection PER connected group.
 * Uses visited + recursionStack to avoid false positives on
 * already-finished back-edges.
 */

/**
 * @param {string[]} groupNodes   All nodes in this connected component
 * @param {object}   adjacency    parent → [children]
 * @returns {boolean}
 */
function groupHasCycle(groupNodes, adjacency) {
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(node) {
    visited.add(node);
    recursionStack.add(node);

    for (const child of adjacency[node] || []) {
      if (!visited.has(child)) {
        if (dfs(child)) return true;
      } else if (recursionStack.has(child)) {
        return true; // back-edge → cycle confirmed
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of groupNodes) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }

  return false;
}

module.exports = { groupHasCycle };
