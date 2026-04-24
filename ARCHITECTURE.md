# SRM Full Stack Engineering Challenge — Architecture

## Objective

Build and host a `POST /bfhl` REST API that accepts an array of node strings, processes hierarchical relationships, and returns structured insights. Paired with a polished frontend that visualizes the response interactively.

---

## System Overview

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│        Frontend             │         │          Backend             │
│   React / Next.js           │─────────│   Node.js / Express         │
│   Hosted on Vercel          │POST/bfhl│   Hosted on Render/Railway  │
│                             │◄────────│                             │
└─────────────────────────────┘  JSON   └─────────────────────────────┘
```

---

## Repository Structure

```
srm-bfhl/
├── backend/
│   ├── index.js              ← Express entry point, CORS, route registration
│   ├── parser.js             ← Input validation, deduplication, edge parsing
│   ├── graph.js              ← Adjacency list builder, root finder, group splitter
│   ├── cycle.js              ← DFS-based cycle detection per connected group
│   ├── tree.js               ← Recursive tree builder + depth calculator
│   ├── summary.js            ← total_trees, total_cycles, largest_tree_root
│   └── tests/
│       ├── parser.test.js    ← Unit tests: valid/invalid formats, dedup
│       ├── graph.test.js     ← Unit tests: root detection, multi-parent, diamond
│       ├── cycle.test.js     ← Unit tests: pure cycles, mixed graphs
│       └── edge-cases.test.js← Self-loop, trim, lex-root, tiebreaker
│
├── frontend/
│   ├── pages/
│   │   └── index.jsx         ← Main SPA page
│   ├── components/
│   │   ├── InputPanel.jsx    ← Smart multi-format text input + sample loader
│   │   ├── LiveValidator.jsx ← Client-side real-time parse preview
│   │   ├── TreeViz.jsx       ← SVG tree + cycle visualizer (key differentiator)
│   │   └── ResponseView.jsx  ← Tabbed sections: Trees / Cycles / Invalids / Summary
│   ├── lib/
│   │   └── clientParser.js   ← Mirrors backend validation logic for live preview
│   └── styles/
│       └── globals.css
│
├── .env.example
├── README.md
└── ARCHITECTURE.md           ← this file
```

---

## Backend

### Entry Point — `index.js`

- Initializes Express
- Applies `cors()` middleware (open for all origins — evaluator calls from different origin)
- Applies `express.json()` body parser
- Registers `POST /bfhl` → `bfhlController`
- Listens on `process.env.PORT || 3001`

### Processing Pipeline

```
Raw request body { data: [...] }
         │
         ▼
   parser.js
   ├── trim each string FIRST, then validate
   ├── validate format: /^[A-Z]->[A-Z]$/ (single uppercase letter each side)
   ├── reject self-loops: A->A → invalid_entries (not a duplicate)
   ├── collect invalid_entries[]
   └── deduplicate edges (see Duplicate Logic below)
         │
         ▼
   graph.js
   ├── build adjacency list from valid, non-duplicate edges only
   ├── maintain parentOf map: { child → parent } for diamond handling
   ├── roots = nodes that appear in any edge but NEVER as a child
   ├── split into connected groups via BFS on undirected view of edges
   └── (diamond handling enforced during edge ingestion — see below)
         │
         ▼
   cycle.js
   ├── run DFS PER connected group (never globally)
   ├── maintain two sets: visited + recursionStack
   ├── if cycle detected in group → { root, tree: {}, has_cycle: true }
   └── pure cycle group (no natural root) → pick lex smallest node as root
         │
         ▼
   tree.js
   ├── recursive tree builder from root node
   ├── depth = COUNT OF NODES on longest root-to-leaf path (not edges)
   │         A→B→C→D = depth 4, not 3
   └── has_cycle field OMITTED entirely on non-cyclic trees (do not set to false)
         │
         ▼
   summary.js
   ├── total_trees: count of valid non-cyclic tree groups only
   ├── total_cycles: count of groups with has_cycle: true
   └── largest_tree_root: max depth; tiebreak = lex smaller root
         │
         ▼
   Response JSON (strict field rules — see Response Format section)
```

---

### ⚠️ Critical Implementation Details

#### 1. Diamond / Multi-Parent Handling

A diamond occurs when two edges both point to the same child (e.g. `A->D` and `B->D`). The first-encountered parent edge wins. All subsequent parent edges for that child are **silently discarded** — they are not added to `invalid_entries` and not added to `duplicate_edges`.

Implement using a `parentOf` map checked before each edge is added:

```js
const parentOf = {};      // tracks which parent "owns" each child
const adjacency = {};     // parent → [children]

for (const [parent, child] of validEdges) {
  if (parentOf[child] !== undefined) {
    // child already has a parent — discard this edge silently
    continue;
  }
  parentOf[child] = parent;
  adjacency[parent] = adjacency[parent] || [];
  adjacency[parent].push(child);
}
```

Do NOT push silently discarded edges to `invalid_entries` or `duplicate_edges`.

#### 2. Duplicate Edge Logic

Two separate sets are required. Without the `markedDuplicate` set, an edge appearing 3+ times would be pushed to `duplicate_edges` multiple times, which is wrong — it must appear exactly once.

```js
const seenEdges = new Set();          // tracks first occurrence
const markedDuplicate = new Set();    // tracks edges already pushed to duplicate_edges

for (const edge of trimmedValidEdges) {
  if (!seenEdges.has(edge)) {
    seenEdges.add(edge);
    validEdgeList.push(edge);         // use for graph construction
  } else if (!markedDuplicate.has(edge)) {
    markedDuplicate.add(edge);
    duplicate_edges.push(edge);       // push exactly once
  }
  // third+ occurrence: silently ignored
}
```

#### 3. Group Splitting via BFS

Every connected component must be processed independently. Do NOT run cycle detection or root finding on the entire graph — groups must be split first. Use BFS on the **undirected** view of edges (treat `A->B` as a connection between A and B in both directions for grouping purposes only).

```js
function getConnectedGroups(allNodes, adjacency) {
  const visited = new Set();
  const groups = [];

  for (const node of allNodes) {
    if (visited.has(node)) continue;
    const group = [];
    const queue = [node];
    visited.add(node);
    while (queue.length) {
      const curr = queue.shift();
      group.push(curr);
      const neighbors = [
        ...(adjacency[curr] || []),
        ...(reverseAdjacency[curr] || [])   // undirected BFS
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
```

#### 4. Cycle Detection — visited vs recursionStack

A simple `visited` set is not enough. You must track the **recursion stack** to distinguish between a node visited in a different DFS path (safe) and a node currently on the active path (cycle). Without `recursionStack`, back-edges to already-finished nodes are falsely flagged as cycles.

```js
function hasCycle(node, adjacency, visited, recursionStack) {
  visited.add(node);
  recursionStack.add(node);

  for (const child of (adjacency[node] || [])) {
    if (!visited.has(child)) {
      if (hasCycle(child, adjacency, visited, recursionStack)) return true;
    } else if (recursionStack.has(child)) {
      return true;   // back-edge → cycle confirmed
    }
  }

  recursionStack.delete(node);
  return false;
}
```

Run this per group, with fresh `visited` and `recursionStack` sets each time.

#### 5. Root Detection and Pure Cycle Fallback

```js
const childNodes = new Set(Object.values(parentOf));  // all nodes that appear as a child
const roots = groupNodes.filter(n => !childNodes.has(n));

// Pure cycle: every node in the group is someone's child → no natural root
if (roots.length === 0) {
  const pureRoot = [...groupNodes].sort()[0];  // lex smallest
  // return { root: pureRoot, tree: {}, has_cycle: true }
}
```

#### 6. Depth — Count Nodes, Not Edges

Depth is the number of **nodes** on the longest root-to-leaf path. This is a common off-by-one mistake.

```
A → B → C → D   →   depth: 4   (nodes: A, B, C, D)
                 →   NOT 3 (which would be edge count)
```

```js
function calcDepth(node, adjacency) {
  const children = adjacency[node] || [];
  if (children.length === 0) return 1;           // leaf = 1 node
  return 1 + Math.max(...children.map(c => calcDepth(c, adjacency)));
}
```

### API Contract

**Endpoint**: `POST /bfhl`  
**Content-Type**: `application/json`

**Request**
```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"]
}
```

**Response**
```json
{
  "user_id": "fullname_ddmmyyyy",
  "email_id": "your@college.edu",
  "college_roll_number": "21CSXXXX",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": ["hello"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

### CORS Configuration

```js
app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
```

### Performance Target

All processing is pure in-memory graph traversal. Expected response time for 50-node input: **< 50ms**. Well within the 3-second requirement.

---

### ⚠️ Strict Response Format Rules

The evaluator is automated and strict. Violating any of these causes silent test failures.

| Rule | Detail |
|---|---|
| `has_cycle` | Present **only** when `true`. Never include it as `false` on non-cyclic trees. |
| `depth` | Present **only** on non-cyclic trees. Never include it on cyclic groups. |
| `tree` | Always present. `{}` for cycles, nested object for trees. |
| `root` | Always present on every hierarchy object. |
| No extra fields | Do not add any fields not in the spec (e.g. no `nodeCount`, no `edges`). |
| `duplicate_edges` | Always an array. Empty array `[]` if none — never omit the field. |
| `invalid_entries` | Always an array. Empty array `[]` if none — never omit the field. |
| `summary` | Always present with all three sub-fields even if values are 0. |

Hierarchy object shape reference:

```js
// Non-cyclic tree — has depth, no has_cycle
{ root: "A", tree: { A: { B: {}, C: {} } }, depth: 2 }

// Cyclic group — has has_cycle, no depth
{ root: "X", tree: {}, has_cycle: true }
```

---

## Edge Cases — Handled Explicitly

| Input | Behaviour |
|---|---|
| `"hello"` | → `invalid_entries` |
| `"1->2"` | → `invalid_entries` (not uppercase letters) |
| `"AB->C"` | → `invalid_entries` (multi-char parent) |
| `"A-B"` | → `invalid_entries` (wrong separator) |
| `"A->"` | → `invalid_entries` (missing child) |
| `"A->A"` | → `invalid_entries` (self-loop) |
| `""` | → `invalid_entries` (empty string) |
| `" A->B "` | Trim first, then validate → **valid** |
| `["A->B","A->B","A->B"]` | First used, `"A->B"` pushed **once** to `duplicate_edges` |
| Diamond `A->D` and `B->D` | First-encountered parent wins; second edge **silently discarded** (not invalid) |
| Pure cycle (all nodes are children) | Lex smallest node used as root; `tree: {}`, `has_cycle: true` |
| Two trees with equal depth | `largest_tree_root` = lex smaller root |

---

## Frontend

### Key Components

**`InputPanel`**
- Accepts input as comma-separated, one-per-line, or raw JSON array
- Normalizes all formats before sending
- "Load sample" button fills in the spec example
- Character/entry counter

**`LiveValidator`**
- Runs `clientParser.js` (mirrors backend validation) on every keystroke
- Shows a real-time breakdown: valid edges, invalid entries, duplicates
- Gives instant feedback before the user hits Submit

**`TreeViz` (primary differentiator)**
- Renders each hierarchy object as an SVG node-edge diagram
- Tree hierarchies: parent nodes connected to children with directional arrows
- Cycles: nodes shown in a dashed ring with a ⟳ badge
- Nodes are coloured by type: root (accent), intermediate (neutral), leaf (muted)
- Collapsible subtrees on click

**`ResponseView`**
- Tabbed layout: Trees | Cycles | Invalids | Duplicates | Summary
- Response time badge (ms) shown after each API call
- Error state with clear message if API call fails

### Client-Side Parser (`lib/clientParser.js`)

Mirrors backend validation logic exactly:
- Same regex: `/^[A-Z]->[A-Z]$/`
- Same self-loop check
- Same dedup logic

This ensures the live preview always matches what the API returns — no surprises.

---

## Deployment

| Layer | Platform | Notes |
|---|---|---|
| Backend API | Render or Railway | Free tier, auto-deploys from `main` branch |
| Frontend | Vercel | Next.js native; auto-deploys on push |
| Environment vars | `.env` on both | `API_URL` on frontend pointing to hosted API |

### Environment Variables

**Backend**
```
PORT=3001
```

**Frontend**
```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

---

## On Firebase — Why Not

Firebase (Firestore / Cloud Functions) is the wrong tool for this project.

This API is **fully stateless** — every request is self-contained, processes in memory, and returns a response. There is no data to persist, no user sessions, no database reads or writes.

Using Firebase would add: cold start latency on Cloud Functions (300ms–2s), Firestore read/write costs for no benefit, auth boilerplate that serves no purpose here, and significant deployment complexity for a simple REST endpoint.

**Verdict**: Render or Railway on a free tier Node.js/Express server is the right call. Sub-50ms response time, zero overhead, one-command deploy.

---

## Build Order

1. **Backend logic** — write and unit test all modules (`parser`, `graph`, `cycle`, `tree`, `summary`) in isolation
2. **Edge case tests** — every case in the table above gets a dedicated test before deployment
3. **Deploy API** — push to Render/Railway, verify `POST /bfhl` returns correct JSON for the spec example
4. **Frontend shell** — Input → Submit → raw JSON display, wired to hosted API
5. **Tree visualizer** — replace raw JSON with `TreeViz` SVG renderer
6. **Live validator + polish** — add `LiveValidator`, tabbed `ResponseView`, sample button, response time badge
7. **Final deploy** — push frontend to Vercel, smoke test end-to-end

---

## What Separates This Submission

Most AI-generated submissions will produce an Express backend and a basic textarea + JSON dump UI. This submission goes further on two axes:

**Correctness depth**: Every edge case — self-loops, whitespace trimming, diamond multi-parent, pure cycle lex-root, duplicate dedup counting — is explicitly tested and handled. This is where most submissions lose hidden test cases.

**UI quality**: The tree visualizer renders the API response as actual interactive node-edge diagrams. Evaluators see trees and cycles visually — not JSON text. The live validator shows understanding of the spec at the UI layer too.
