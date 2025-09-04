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
    details: r.description,
    completed: r.status === 'completed',
    completionReason: r.completion_reason,
    completionSignature: r.completion_signature,
    completedAt: r.completed_at
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
  const existing = await db.query('SELECT status FROM tasks WHERE id=$1', [id]);
  if (existing.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  if (existing.rows[0].status === 'completed' && completed === false) {
    return res.status(400).json({ error: 'Completed tasks cannot be reverted to pending' });
  }
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
  const { id } = req.params;
  const { title, details, completed, completionReason, completionSignature } = req.body;

  try {
    // Fetch current row to determine transition
    const current = await db.query('SELECT * FROM tasks WHERE id=$1', [id]);
    const currentRow = current.rows[0];
    const wasCompleted = currentRow.status === 'completed';

    if (wasCompleted && patchHasCompletedFalse(req.body)) {
      return res.status(400).json({ error: 'Completed tasks cannot be reverted to pending' });
    }

    function patchHasCompletedFalse(body) {
      return Object.prototype.hasOwnProperty.call(body, 'completed') && body.completed === false;
    }
    // Build dynamic set clause
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (details !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(details);
    }
    if (completed !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(completed ? 'completed' : 'pending');
      if (completed) {
        // If marking complete NOW (and wasn't before), set audit
        if (!wasCompleted) {
          fields.push(`completed_at = now()`);
          if (completionReason !== undefined) {
            fields.push(`completion_reason = $${idx++}`);
            values.push(completionReason);
          }
          if (completionSignature !== undefined) {
            fields.push(`completion_signature = $${idx++}`);
            values.push(completionSignature);
          }
        } else {
          // Already completed: allow updating reason/signature if sent
          if (completionReason !== undefined) {
            fields.push(`completion_reason = $${idx++}`);
            values.push(completionReason);
          }
          if (completionSignature !== undefined) {
            fields.push(`completion_signature = $${idx++}`);
            values.push(completionSignature);
          }
        }
      } else {
        // Reverting to pending: clear audit
        fields.push('completion_reason = NULL');
        fields.push('completion_signature = NULL');
        fields.push('completed_at = NULL');
      }
    } else {
      // If not toggling status but user wants to update reason/signature only while completed
      if (wasCompleted) {
        if (completionReason !== undefined) {
          fields.push(`completion_reason = $${idx++}`);
          values.push(completionReason);
        }
        if (completionSignature !== undefined) {
          fields.push(`completion_signature = $${idx++}`);
          values.push(completionSignature);
        }
      }
    }

    if (fields.length === 0) {
      return res.json(mapRow(current.rows[0]));
    }

    values.push(id);
    const sql = `UPDATE tasks SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
    const updated = await db.query(sql, values);
    res.json(mapRow(updated.rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update failed' });
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

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    details,
    completed,
    completionReason,
    completionSignature
  } = req.body;

  if (title == null || completed == null) {
    return res.status(400).json({ error: 'title and completed required' });
  }

  try {
    let status = completed ? 'completed' : 'pending';
    let completionCols = '';
    const values = [title, details || null, status];
    let idx = 4;

    if (completed) {
      completionCols = `,
        completion_reason = $${idx++},
        completion_signature = $${idx++},
        completed_at = COALESCE(completed_at, now())`;
      values.push(completionReason || null, completionSignature || null);
    } else {
      completionCols = `,
        completion_reason = NULL,
        completion_signature = NULL,
        completed_at = NULL`;
    }

    values.push(id);

    const sql = `
      UPDATE tasks
      SET title = $1,
          description = $2,
          status = $3
          ${completionCols},
          updated_at = now()
      WHERE id = $${idx}
      RETURNING *`;

    const r = await db.query(sql, values);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(mapRow(r.rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update failed' });
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