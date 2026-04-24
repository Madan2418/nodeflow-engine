# NodeFlow

NodeFlow is a full-stack graph intelligence app built for the BFHL hierarchy challenge. Paste raw node-edge strings like `A->B`, and it turns them into validated hierarchy trees, cycle diagnostics, duplicate-edge reporting, and a visual frontend that makes the output easy to inspect.

It is designed to feel stronger than a basic challenge submission: the backend enforces strict parsing and graph rules, while the frontend gives a polished workflow for testing, validating, and understanding the response in real time.

## Live Demo

- Frontend: https://nodeflow-engine.vercel.app/
- API: https://nodeflow-engine.onrender.com

## Why This Project Stands Out

- Accepts noisy input and separates valid edges, invalid entries, and duplicates cleanly.
- Detects cycles per connected component instead of flattening everything into one ambiguous result.
- Builds hierarchy trees with deterministic behavior, including diamond-conflict handling.
- Mirrors backend validation in the UI so users get feedback before they even submit.
- Presents results visually, not just as raw JSON.

## Core Capabilities

- `POST /bfhl` processes an input array of relationships and returns:
  - identity metadata
  - generated hierarchies
  - invalid entries
  - duplicate edges
  - summary statistics
- `GET /bfhl` returns the static identity object for quick health verification.
- Interactive frontend with:
  - smart text input
  - live validation preview
  - response tabs
  - tree and cycle visualization

## Live API Example

### Request

```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"]
}
```

### Response

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

## Tech Stack

- Backend: Node.js, Express
- Frontend: Next.js 14, React 18
- Testing: Jest
- Hosting: Vercel, Render

## Project Structure

```text
nodeflow-engine/
|-- backend/
|   |-- index.js
|   |-- constants.js
|   |-- parser.js
|   |-- graph.js
|   |-- cycle.js
|   |-- tree.js
|   |-- summary.js
|   `-- tests/
|-- frontend/
|   |-- pages/
|   |-- components/
|   |-- lib/
|   `-- styles/
|-- ARCHITECTURE.md
`-- README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Backend

```bash
cd backend
npm install
npm start
```

The API runs on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

Set `frontend/.env.local` if you want to point the UI at a custom API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Running Tests

```bash
cd backend
npm test
```

Current backend coverage includes parser rules, graph construction, cycle detection, and integration-style edge cases.

## Processing Rules

- Valid edge format: `A->B`
- Only single uppercase letters are accepted as node names.
- Self-loops like `A->A` are treated as invalid.
- Whitespace is trimmed before validation.
- Duplicate edges are accepted once and then reported in `duplicate_edges`.
- Diamond conflicts keep the first parent and discard later conflicting parents.
- Cycles are detected per connected group.
- Depth is measured by node count on the longest path.
- `has_cycle` appears only when true.
- `depth` appears only for non-cyclic hierarchies.

## Submission Notes

Identity constants are hardcoded in [backend/constants.js](/D:/projects/nodeflow-engine-bajaj/nodeflow-engine/backend/constants.js:1), which matches the challenge requirements for static response fields.

Deployed endpoints:

- Frontend on Vercel: https://nodeflow-engine.vercel.app/
- Backend on Render: https://nodeflow-engine.onrender.com

## Documentation

- Architecture notes: [ARCHITECTURE.md](/D:/projects/nodeflow-engine-bajaj/nodeflow-engine/ARCHITECTURE.md:1)
- Challenge paper summary: [paper.md](/D:/projects/nodeflow-engine-bajaj/nodeflow-engine/paper.md:1)
