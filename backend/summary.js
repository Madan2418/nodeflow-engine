/**
 * summary.js
 * Computes total_trees, total_cycles, and largest_tree_root.
 * Tiebreak: lexicographically smaller root wins.
 */

/**
 * @param {Array} hierarchies  Array of hierarchy objects (already built)
 * @returns {{ total_trees: number, total_cycles: number, largest_tree_root: string }}
 */
function buildSummary(hierarchies) {
  let total_trees = 0;
  let total_cycles = 0;
  let largest_tree_root = "";
  let maxDepth = -1;

  for (const h of hierarchies) {
    if (h.has_cycle) {
      total_cycles++;
    } else {
      total_trees++;
      // tiebreak: lex smaller root wins
      if (
        h.depth > maxDepth ||
        (h.depth === maxDepth && h.root < largest_tree_root)
      ) {
        maxDepth = h.depth;
        largest_tree_root = h.root;
      }
    }
  }

  return { total_trees, total_cycles, largest_tree_root };
}

module.exports = { buildSummary };
