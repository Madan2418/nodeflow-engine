# NodeFlow — BFHL Hierarchy Analyser

> SRM Full Stack Engineering Challenge — Round 1

A full-stack application that accepts an array of node-edge strings (`A->B`), processes hierarchical relationships, detects cycles, and returns structured insights via a REST API — paired with a polished interactive frontend.

---

## Live URLs

| | URL |
|---|---|
| **Frontend** | _deploy to Vercel — add URL here_ |
| **API** | _deploy to Render/Railway — add URL here_ |
| **GitHub** | _add repo URL here_ |

---

## Quick Start (Local)

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1 — Backend

```bash
cd backend
npm install
node index.js
# → 🚀  BFHL API running on http://localhost:3001
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

> The frontend reads `NEXT_PUBLIC_API_URL` from `frontend/.env.local` — defaults to `http://localhost:3001`.

---

## API Reference

### `POST /bfhl`

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
  "email_id": "you@srmist.edu.in",
  "college_roll_number": "RA2211XXXXXXX",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": { "D": {} }, "C": {} } }, "depth": 3 },
    { "root": "X", "tree": {}, "has_cycle": true }
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

### `GET /bfhl`

Returns the identity object (`user_id`, `email_id`, `college_roll_number`).

---

## Project Structure

```
nodeflow-engine/
├── backend/
│   ├── index.js          ← Express entry point + CORS + routes
│   ├── constants.js      ← ⚠️ Hardcode your credentials here
│   ├── parser.js         ← Input validation, trim, dedup
│   ├── graph.js          ← Adjacency list, diamond guard, BFS groups
│   ├── cycle.js          ← DFS cycle detection (visited + recursionStack)
│   ├── tree.js           ← Recursive tree builder + node-count depth
│   ├── summary.js        ← total_trees, total_cycles, largest_tree_root
│   └── tests/
│       ├── parser.test.js
│       ├── graph.test.js
│       ├── cycle.test.js
│       └── edge-cases.test.js  ← full-pipeline integration tests
│
├── frontend/
│   ├── pages/
│   │   ├── _app.jsx
│   │   └── index.jsx           ← Main SPA page
│   ├── components/
│   │   ├── InputPanel.jsx      ← Smart textarea + sample loader
│   │   ├── LiveValidator.jsx   ← Real-time parse preview chips
│   │   ├── TreeViz.jsx         ← SVG tree + cycle visualiser
│   │   └── ResponseView.jsx    ← Tabbed results view
│   ├── lib/
│   │   └── clientParser.js     ← Mirrors backend validation (live preview)
│   └── styles/
│       └── globals.css         ← Full design system
│
├── ARCHITECTURE.md
└── README.md
```

---

## Running Tests

```bash
cd backend
npm test
```

All 4 test files run automatically:

| File | What it covers |
|---|---|
| `parser.test.js` | Format validation, trimming, self-loops, exact-once dedup |
| `graph.test.js` | Adjacency, root detection, diamond, group splitting, order |
| `cycle.test.js` | DFS correctness, cross-edge vs back-edge, false positives |
| `edge-cases.test.js` | Full pipeline integration, spec example, all strict rules |

---

## Key Processing Rules

| Rule | Behaviour |
|---|---|
| Valid format | `/^[A-Z]->[A-Z]$/` — single uppercase letter each side |
| Self-loop `A->A` | → `invalid_entries` |
| Whitespace `" A->B "` | Trim first, then validate → **valid** |
| Duplicate edge (3×) | First used, pushed to `duplicate_edges` **once** |
| Diamond `A->D` + `B->D` | First parent wins; second **silently discarded** |
| Cycle detection | DFS with `visited` + `recursionStack` per connected group |
| Pure cycle root | Lex-smallest node in the group |
| Depth | **Node count** on longest path — `A→B→C = 3`, not 2 |
| `has_cycle` field | Present **only** when `true` — never set to `false` |
| `depth` field | Present **only** on non-cyclic trees |

---

## ⚠️ Before Submitting

1. Open `backend/constants.js` and replace the placeholder credentials with your real ones:
   ```js
   USER_ID: "yourname_ddmmyyyy",   // e.g. "madanbajaj_24042004"
   EMAIL_ID: "you@srmist.edu.in",
   COLLEGE_ROLL_NUMBER: "RA2211XXXXXXX",
   ```
2. Deploy backend to Render or Railway
3. Set `NEXT_PUBLIC_API_URL` in Vercel environment variables to your hosted API URL
4. Deploy frontend to Vercel
5. Run the full spec example against the live API and verify the response matches exactly

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Frontend | Next.js 14 + React 18 |
| Styling | Vanilla CSS (design system) |
| Testing | Jest |
| Backend hosting | Render / Railway |
| Frontend hosting | Vercel |
