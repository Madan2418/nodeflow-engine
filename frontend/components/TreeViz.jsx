/**
 * TreeViz.jsx — SVG tree + cycle visualiser
 *
 * Non-cyclic trees: recursive layout, coloured nodes (root / mid / leaf)
 * Cyclic groups:   actual cycle nodes reconstructed from submitted edges,
 *                  rendered as a dashed ring with directional arrows
 */

const NODE_R = 20;
const H_GAP  = 80;
const V_GAP  = 52;

// ── Helpers: reconstruct cycle group nodes from submitted edge strings ────────
const VALID_RE = /^[A-Z]->[A-Z]$/;

function getCycleGroupNodes(root, allEdges) {
  const adj = {};
  for (const e of allEdges) {
    const t = typeof e === "string" ? e.trim() : String(e).trim();
    if (!VALID_RE.test(t)) continue;
    const [p, c] = t.split("->");
    if (p === c) continue;
    adj[p] = adj[p] || new Set();
    adj[c] = adj[c] || new Set();
    adj[p].add(c);
    adj[c].add(p); // undirected for grouping
  }

  const visited = new Set();
  const queue = [root];
  visited.add(root);
  while (queue.length) {
    const node = queue.shift();
    for (const nb of adj[node] || []) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
  }
  return [...visited].sort();
}

// ── Tree layout ───────────────────────────────────────────────────────────────
function layoutTree(node, subtree, depth, yOffset, positions) {
  const children = Object.keys(subtree[node] || {});
  const x = depth * H_GAP + NODE_R + 12;

  if (children.length === 0) {
    positions[node] = { x, y: yOffset + NODE_R };
    return yOffset + V_GAP;
  }

  let childY = yOffset;
  const childPositions = [];
  for (const child of children) {
    childY = layoutTree(child, subtree[node], depth + 1, childY, positions);
    childPositions.push(positions[child].y);
  }

  positions[node] = {
    x,
    y: (childPositions[0] + childPositions[childPositions.length - 1]) / 2,
  };
  return childY;
}

function collectEdges(node, subtree, positions, edges = []) {
  for (const child of Object.keys(subtree[node] || {})) {
    edges.push({ from: positions[node], to: positions[child] });
    collectEdges(child, subtree[node], positions, edges);
  }
  return edges;
}

function collectAllNodes(node, subtree, depth = 0, out = []) {
  out.push({ id: node, depth });
  for (const child of Object.keys(subtree[node] || {})) {
    collectAllNodes(child, subtree[node], depth + 1, out);
  }
  return out;
}

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = {
  root:  { fill: "#2563eb", stroke: "#1d4ed8", text: "#fff" },
  mid:   { fill: "#f1f5f9", stroke: "#94a3b8", text: "#334155" },
  leaf:  { fill: "#f8fafc", stroke: "#cbd5e1", text: "#475569" },
  cycle: { fill: "#fef2f2", stroke: "#fca5a5", text: "#dc2626" },
};

function nodeColor(depth, isLeaf) {
  if (depth === 0) return COLORS.root;
  if (isLeaf)      return COLORS.leaf;
  return COLORS.mid;
}

// ── Arrow marker defs ─────────────────────────────────────────────────────────
function ArrowDefs({ id, color }) {
  return (
    <defs>
      <marker id={id} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill={color} />
      </marker>
    </defs>
  );
}

// ── Safe directed line (guards NaN when from === to) ─────────────────────────
function Arrow({ from, to, stroke, markerId }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (!len || isNaN(len)) return null;            // ← NaN guard

  const ux = dx / len;
  const uy = dy / len;

  return (
    <line
      x1={from.x + ux * NODE_R}
      y1={from.y + uy * NODE_R}
      x2={to.x   - ux * (NODE_R + 6)}
      y2={to.y   - uy * (NODE_R + 6)}
      stroke={stroke}
      strokeWidth="1.8"
      markerEnd={`url(#${markerId})`}
    />
  );
}

// ── Cycle ring layout ─────────────────────────────────────────────────────────
function cyclePositions(nodes) {
  const n = nodes.length;
  if (n === 1) {
    return [{ id: nodes[0], x: NODE_R + 30, y: NODE_R + 20 }];
  }
  const R = Math.max(55, n * 20);
  const cx = R + NODE_R + 12;
  const cy = R + NODE_R + 12;
  return nodes.map((id, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { id, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
}

// ── CycleSVG ──────────────────────────────────────────────────────────────────
function CycleSVG({ root, allEdges }) {
  const nodes   = getCycleGroupNodes(root, allEdges);
  const positions = cyclePositions(nodes);

  const xs = positions.map(p => p.x);
  const ys = positions.map(p => p.y);
  const svgW = Math.max(140, Math.max(...xs) + NODE_R + 20);
  const svgH = Math.max(90,  Math.max(...ys) + NODE_R + 20);

  const uid = `cyc-${root}`;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      <ArrowDefs id={uid} color="#fca5a5" />

      {/* Ring edges — only drawn when there are 2+ nodes */}
      {nodes.length > 1 && positions.map((pos, i) => {
        const next = positions[(i + 1) % positions.length];
        return (
          <Arrow
            key={i}
            from={pos}
            to={next}
            stroke="#fca5a5"
            markerId={uid}
          />
        );
      })}

      {/* Single-node self-loop arc */}
      {nodes.length === 1 && (() => {
        const cx = positions[0].x;
        const cy = positions[0].y;
        const r  = NODE_R + 12;
        return (
          <path
            d={`M ${cx + NODE_R} ${cy} A ${r} ${r} 0 1 1 ${cx} ${cy - NODE_R}`}
            fill="none"
            stroke="#fca5a5"
            strokeWidth="1.8"
            strokeDasharray="5 3"
          />
        );
      })()}

      {/* Nodes */}
      {positions.map(({ id, x, y }) => {
        const isRoot = id === root;
        return (
          <g key={id}>
            <circle
              cx={x} cy={y} r={NODE_R}
              fill={isRoot ? "#fee2e2" : COLORS.cycle.fill}
              stroke={isRoot ? "#ef4444" : "#fca5a5"}
              strokeWidth={isRoot ? 2.5 : 1.8}
              strokeDasharray={isRoot ? "none" : "4 2"}
            />
            <text
              x={x} y={y}
              textAnchor="middle" dominantBaseline="central"
              fill={COLORS.cycle.text}
              fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif"
            >
              {id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── TreeSVG ───────────────────────────────────────────────────────────────────
function TreeSVG({ root, tree }) {
  const subtree  = { [root]: tree[root] || {} };
  const allNodes = collectAllNodes(root, subtree);

  // leaf detection: no children in the nested tree
  const leafSet = new Set(
    allNodes.filter(({ id, depth }) => {
      // walk into subtree to check children
      let cur = subtree;
      const path = allNodes.slice(0, allNodes.findIndex(n => n.id === id) + 1);
      // simpler: just check adjacency depth-first
      return true; // re-check below
    }).map(n => n.id)
  );
  // rebuild leaf set properly
  leafSet.clear();
  function markLeaves(node, sub) {
    const children = Object.keys(sub[node] || {});
    if (!children.length) { leafSet.add(node); return; }
    children.forEach(c => markLeaves(c, sub[node]));
  }
  markLeaves(root, subtree);

  const positions = {};
  layoutTree(root, subtree, 0, 0, positions);

  const edges = collectEdges(root, subtree, positions);

  const xs   = Object.values(positions).map(p => p.x);
  const ys   = Object.values(positions).map(p => p.y);
  const svgW = Math.max(160, Math.max(...xs) + NODE_R + 20);
  const svgH = Math.max(80,  Math.max(...ys) + NODE_R + 20);

  const uid = `tree-${root}`;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      <ArrowDefs id={uid} color="#94a3b8" />

      {edges.map((e, i) => (
        <Arrow key={i} from={e.from} to={e.to} stroke="#cbd5e1" markerId={uid} />
      ))}

      {allNodes.map(({ id, depth }) => {
        const pos   = positions[id];
        if (!pos) return null;
        const c     = nodeColor(depth, leafSet.has(id));
        return (
          <g key={id}>
            <circle cx={pos.x} cy={pos.y} r={NODE_R}
              fill={c.fill} stroke={c.stroke} strokeWidth="2" />
            <text
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="central"
              fill={c.text} fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif"
            >
              {id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Public: TreeViz ───────────────────────────────────────────────────────────
export default function TreeViz({ hierarchy, allEdges }) {
  const { root, tree, depth, has_cycle } = hierarchy;

  return (
    <div className="tree-card animate-popIn">
      <div className="tree-card-header">
        <span className="tree-card-title">Root: {root}</span>
        {has_cycle ? (
          <span className="tree-meta-badge cycle-badge">↻ Cycle</span>
        ) : (
          <span className="tree-meta-badge tree-badge">Depth {depth}</span>
        )}
      </div>
      <div className="tree-svg-wrap">
        {has_cycle ? (
          <CycleSVG root={root} allEdges={allEdges || []} />
        ) : (
          <TreeSVG root={root} tree={tree} />
        )}
      </div>
    </div>
  );
}
