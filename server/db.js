import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'task_storage',
  user: process.env.PGUSER || 'task_user',
  password: process.env.PGPASSWORD || 'strongpassword',
  max: 10,
  idleTimeoutMillis: 10_000
});

export const query = (text, params) => pool.query(text, params);
export default pool;