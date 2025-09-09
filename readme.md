# Task Manager (Full‑stack)

React + Vite frontend with an Express + PostgreSQL API. Features include CRUD, filters, bulk actions, completion audit, and a modern, themeable table.

## Stack
- Frontend: React (Vite)
- Backend: Node.js (Express)
- DB: PostgreSQL (pg)

## Repo layout
```
sample-app/
  client/                     # React app
    src/
      components/             # UI components
      hooks/                  # Data hooks
      styles/                 # CSS (see below)
      main.jsx                # App entry
    public/                   # Static assets
  server/                     # Express API
    index.js                  # API entry
    db.js                     # PG pool
    database.sql              # Schema (optional helper)
```

## Prerequisites
- Node.js 18+ (20+ recommended)
- PostgreSQL 14+ running locally

## Database setup
Option A — run provided SQL
```sh
psql -d postgres -f server/database.sql
```

Option B — manual
```sql
CREATE ROLE task_user WITH LOGIN PASSWORD 'strongpassword';
CREATE DATABASE task_storage OWNER task_user;
\c task_storage;
CREATE TYPE task_status AS ENUM ('pending','in_progress','completed');
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completion_reason TEXT,
  completion_signature TEXT,
  completed_at TIMESTAMPTZ
);
```

## Run the API
```sh
cd server
npm install
npm run dev   # http://localhost:3000
```
Environment (optional, defaults shown):
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=task_storage
PGUSER=task_user
PGPASSWORD=strongpassword
PORT=3000
```
On first run, the server seeds a couple of tasks.

## Run the UI
```sh
cd client
npm install
```

Pick ONE of these:

A) Direct API URL (recommended)
```
# client/.env.local
VITE_API_URL=http://localhost:3000
```
Then:
```sh
npm run dev   # http://localhost:5173
```

B) Vite dev proxy (no env var)
Add to vite.config.js:
```js
export default {
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
}
```
Then:
```sh
npm run dev
```

## API endpoints
- GET /api/health
- GET /api/tasks?filter=all|completed|incomplete
- GET /api/tasks/:id
- POST /api/tasks            { title, details? }
- PATCH /api/tasks/:id       partial { title?, details?, completed?, completionReason?, completionSignature? }
- PUT /api/tasks/:id         full update { title, details, completed, completionReason?, completionSignature? }
- POST /api/tasks/bulk/delete { ids: number[] }

Response task shape:
```json
{
  "id": 1,
  "title": "Sample",
  "details": "text",
  "completed": false,
  "completionReason": null,
  "completionSignature": null,
  "completedAt": null
}
```

## Styling guide
The UI uses a small, scalable CSS structure.

Imports (client/src/main.jsx):
```js
import './styles/globals.css';     // reset + tokens + base + utilities
import './styles/components.css';  // imports all component CSS (see below)
import './styles/app.css';         // header + page layout + banners
```

Components aggregator (client/src/styles/components.css) imports:
- 20-components-header.css
- 20-components-buttons.css
- 20-components-forms.css
- 20-components-modal.css
- 20-components-table.css
- 20-components-filter.css
- 20-components-bulk-actions.css

Table theming
- Colorful themes via data-theme on the wrapper: lavender | sunrise | berry | ocean (default is mint).
- Density via data-density on the wrapper: compact | cozy.
Example:
```jsx
<div className="table-wrapper" data-theme="lavender" data-density="compact">
  <table id="task-table">…</table>
</div>
```

Dark theme (optional)
- Variables for dark live in styles/40-theme-dark.css. Import it in main.jsx to enable toggling.
```js
// main.jsx (optional)
import './styles/40-theme-dark.css';
// Toggle: document.documentElement.classList.toggle('dark', true);
```

## Common issues
- Unexpected token '<' … not valid JSON
  - The frontend received HTML instead of JSON. Ensure:
    - VITE_API_URL points to the API (http://localhost:3000), or
    - Vite proxy is configured and you call relative /api/… URLs.
  - Confirm in DevTools Network that /api/* returns application/json.

- “Failed to resolve import './styles/app.css'”
  - Ensure the file exists at client/src/styles/app.css or remove the import.

- Styles not applying / colors missing on table action buttons
  - Buttons should have classes: action-btn edit | complete | delete (or edit-btn/complete-btn/delete-btn with action-btn). The table CSS includes variants for both.

- Favicon 404
  - Add a favicon file to client/public and reference it in index.html, or use Vite’s default vite.svg.

## Scripts
Backend:
- npm run dev — start API with nodemon
- npm start — start API with node

Frontend:
- npm run dev — Vite dev server
- npm run build — production build to client/dist
- npm run preview — serve built assets locally

## Deployment (static hosting for UI)
- Build UI: cd client && npm run build (outputs client/dist)
- Host dist/ with any static host (GitHub Pages, Netlify, etc.)
- API must be deployed separately (Render, Railway, Fly.io, etc.). Set VITE_API_URL to the deployed API URL and rebuild.

## License
Educational sample. Add your license text if publishing.