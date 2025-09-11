import { query } from '../db.js';

export default class TasksRepository {
  async findAll(filter, { limit, offset } = {}) {
    // filter: all|completed|incomplete
    const where =
      filter === 'completed' ? `WHERE status = 'completed'` :
      filter === 'incomplete' ? `WHERE status <> 'completed'` : '';
    const parts = [`SELECT * FROM tasks ${where} ORDER BY created_at DESC`];
    const vals = [];
    if (Number.isInteger(limit) && Number.isInteger(offset)) {
      vals.push(limit, offset);
      parts.push(`LIMIT $${vals.length - 1 + 1} OFFSET $${vals.length}`);
    }
    const sql = parts.join(' ');
    const { rows } = await query(sql, vals.length ? vals : undefined);
    return rows;
  }

  async findById(id) {
    const { rows } = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    return rows[0];
  }

  async insert({ title, description }) {
    const sql = `
      INSERT INTO tasks (title, description, status)
      VALUES ($1, $2, 'pending')
      RETURNING *`;
    const { rows } = await query(sql, [title, description]);
    return rows[0];
  }

  async updateFull(id, { title, description, status }) {
    const sql = `
      UPDATE tasks
      SET title=$1, description=$2, status=$3, 
          completed_at = CASE WHEN $3 = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
          updated_at = NOW()
      WHERE id=$4
      RETURNING *`;
    const { rows } = await query(sql, [title, description, status, id]);
    return rows[0];
  }

  async updatePartial(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      const { rows } = await query('SELECT * FROM tasks WHERE id=$1', [id]);
      return rows[0];
    }
    const sets = [];
    const vals = [];
    let i = 1;
    for (const k of keys) {
      if (k === 'completed_at' && fields[k] === 'NOW()') {
        sets.push(`completed_at = NOW()`);
      } else {
        sets.push(`${k} = $${i++}`);
        vals.push(fields[k]);
      }
    }
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    const sql = `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`;
    const { rows } = await query(sql, vals);
    return rows[0];
  }

  async deleteById(id) {
    const { rowCount } = await query('DELETE FROM tasks WHERE id=$1', [id]);
    return rowCount;
  }

  async bulkDelete(ids) {
    const { rowCount } = await query('DELETE FROM tasks WHERE id = ANY($1::int[])', [ids]);
    return rowCount;
  }
}