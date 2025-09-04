import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function mapRow(r) {
  return {
    id: r.id,
    title: r.title,
    details: r.description || '',
    completed: r.status === 'completed'
  };
}

async function ensureSeed() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM tasks');
  if (rows[0].count === 0) {
    await db.query(
      `INSERT INTO tasks (title, description, status)
       VALUES ($1,$2,$3), ($4,$5,$6)`,
      [
        'Sample Task 1', 'Example details', 'pending',
        'Sample Task 2', 'Another example', 'completed'
      ]
    );
    console.log('Seeded initial tasks');
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM tasks');
    res.json({ ok: true, count: rows[0].count });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  const filter = req.query.filter || 'all';
  let sql = 'SELECT * FROM tasks';
  if (filter === 'completed') sql += " WHERE status='completed'";
  else if (filter === 'incomplete') sql += " WHERE status!='completed'";
  sql += ' ORDER BY id DESC';
  try {
    const { rows } = await db.query(sql);
    res.json(rows.map(mapRow));
  } catch (e) {
    console.error('GET /api/tasks error', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(mapRow(rows[0]));
  } catch (e) {
    console.error('GET /api/tasks/:id error', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, details } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });
  try {
    const { rows } = await db.query(
      `INSERT INTO tasks (title, description, status)
       VALUES ($1,$2,'pending') RETURNING *`,
      [title.trim(), (details || '').trim()]
    );
    res.status(201).json(mapRow(rows[0]));
  } catch (e) {
    console.error('POST /api/tasks error', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { title, details, completed } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });
  const status = completed ? 'completed' : 'pending';
  try {
    const { rows } = await db.query(
      `UPDATE tasks
       SET title=$1, description=$2, status=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [title.trim(), (details || '').trim(), status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(mapRow(rows[0]));
  } catch (e) {
    console.error('PUT /api/tasks/:id error', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  const { title, details, completed } = req.body;
  try {
    const existing = await db.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });
    const cur = existing.rows[0];
    const newTitle = title !== undefined ? title : cur.title;
    if (!newTitle || !newTitle.trim()) return res.status(400).json({ error: 'Title required' });
    const newDesc = details !== undefined ? details : cur.description;
    const newStatus = completed !== undefined ? (completed ? 'completed' : 'pending') : cur.status;
    const { rows } = await db.query(
      `UPDATE tasks
       SET title=$1, description=$2, status=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [newTitle.trim(), (newDesc || '').trim(), newStatus, req.params.id]
    );
    res.json(mapRow(rows[0]));
  } catch (e) {
    console.error('PATCH /api/tasks/:id error', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    console.error('DELETE /api/tasks/:id error', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

app.put('/api/tasks/bulk/status', async (req, res) => {
  const { ids, completed } = req.body;
  if (!Array.isArray(ids) || typeof completed !== 'boolean')
    return res.status(400).json({ error: 'ids[] and completed required' });
  try {
    const status = completed ? 'completed' : 'pending';
    const result = await db.query(
      `UPDATE tasks SET status=$2, updated_at=NOW() WHERE id = ANY($1::int[])`,
      [ids, status]
    );
    res.json({ updated: result.rowCount });
  } catch (e) {
    console.error('PUT /api/tasks/bulk/status error', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

app.post('/api/tasks/bulk/delete', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids[] required' });
  try {
    const result = await db.query(
      `DELETE FROM tasks WHERE id = ANY($1::int[])`,
      [ids]
    );
    res.json({ deleted: result.rowCount });
  } catch (e) {
    console.error('POST /api/tasks/bulk/delete error', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Global error handlers
process.on('unhandledRejection', err => {
  console.error('UnhandledRejection', err);
});
process.on('uncaughtException', err => {
  console.error('UncaughtException', err);
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await db.query('SELECT 1');
    await ensureSeed();
    app.listen(PORT, () =>
      console.log(`API running on http://localhost:${PORT}`)
    );
  } catch (e) {
    console.error('Startup failure:', e);
    process.exit(1);
  }
})();