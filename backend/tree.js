/**
 * tree.js
 * Recursive tree builder + depth calculator (node count, not edge count).
 * depth(A→B→C→D) = 4
 */

/**
 * Builds a nested object tree from root.
 * @param {string} node
 * @param {object} adjacency
 * @returns {object}
 */
function buildTree(node, adjacency) {
  const children = adjacency[node] || [];
  const subtree = {};
  for (const child of children) {
    subtree[child] = buildTree(child, adjacency);
  }
  return subtree;
}

/**
 * Depth = number of NODES on the longest root-to-leaf path.
 * Leaf node returns 1 (itself).
 * @param {string} node
 * @param {object} adjacency
 * @returns {number}
 */
function calcDepth(node, adjacency) {
  const children = adjacency[node] || [];
  if (children.length === 0) return 1; // leaf
  return 1 + Math.max(...children.map((c) => calcDepth(c, adjacency)));
}

module.exports = { buildTree, calcDepth };
