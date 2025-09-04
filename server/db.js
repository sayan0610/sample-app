import { Pool } from 'pg';

const db = new Pool({
  user: "task_user",
  host: "localhost",
  database: "task_storage",
  password: "strongpassword",
  port: 5432,
});

export default db;