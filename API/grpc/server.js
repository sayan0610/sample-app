import 'dotenv/config';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import { fileURLToPath } from 'url';

// Resolve proto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, 'tasks.proto');

const loaderOpts = { keepCase: true, longs: String, enums: String, defaults: false, oneofs: true };

// In-memory store for demo; replace with DB wiring if needed
let nextId = 1;
/** @type {Array<any>} */
const tasks = [];

function nowISO() { return new Date().toISOString(); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function mapTask(t) { return clone(t); }
function findIndexById(id) { return tasks.findIndex(t => t.id === id); }
function applyFilter(items, filter) {
  switch ((filter || 'all').toLowerCase()) {
    case 'active': return items.filter(t => !t.completed);
    case 'completed': return items.filter(t => !!t.completed);
    default: return items;
  }
}

export async function startGrpc() {
  const pkgDef = await protoLoader.load(PROTO_PATH, loaderOpts);
  const proto = grpc.loadPackageDefinition(pkgDef);
  const tasksPkg = proto.tasks;

  // Handlers (stub in your real impl)
  const handlers = {
    List: (call, cb) => {
      const { filter, page, pageSize } = call.request || {};
      let items = applyFilter(tasks, filter);
      if (page && pageSize) {
        const p = Number(page), ps = Number(pageSize);
        const start = (p - 1) * ps;
        items = items.slice(start, start + ps);
      }
      cb(null, { items: items.map(mapTask) });
    },
    Get: (call, cb) => {
      const id = Number(call.request?.id);
      const idx = findIndexById(id);
      if (idx === -1) return cb({ code: grpc.status.NOT_FOUND, message: 'Not found' });
      cb(null, mapTask(tasks[idx]));
    },
    Create: (call, cb) => {
      const { title, details } = call.request || {};
      if (!title || !String(title).trim()) return cb({ code: grpc.status.INVALID_ARGUMENT, message: 'title required' });
      const now = nowISO();
      const t = {
        id: nextId++,
        title: String(title).trim(),
        details: (details ?? '').trim() || '',
        completed: false,
        completionReason: '',
        completionSignature: '',
        createdAt: now,
        updatedAt: now,
        completedAt: ''
      };
      tasks.unshift(t);
      cb(null, mapTask(t));
    },
    Update: (call, cb) => {
      const { id, title, details, completed } = call.request || {};
      const idx = findIndexById(Number(id));
      if (idx === -1) return cb({ code: grpc.status.NOT_FOUND, message: 'Not found' });
      const now = nowISO();
      const t = tasks[idx];
      t.title = String(title ?? t.title).trim();
      t.details = String(details ?? t.details);
      const willComplete = !!completed;
      if (!t.completed && willComplete) {
        t.completed = true;
        t.completedAt = now;
      } else if (t.completed && !willComplete) {
        t.completed = false;
        t.completedAt = '';
      }
      t.updatedAt = now;
      cb(null, mapTask(t));
    },
    Patch: (call, cb) => {
      const { id } = call.request || {};
      const idx = findIndexById(Number(id));
      if (idx === -1) return cb({ code: grpc.status.NOT_FOUND, message: 'Not found' });
      const now = nowISO();
      const t = tasks[idx];
      const r = call.request || {};
      // wrappers may arrive as { value: any } objects; also accept raw values
      const asVal = (w) => (w && typeof w === 'object' && 'value' in w) ? w.value : w;
      if (r.title !== undefined) t.title = String(asVal(r.title) ?? t.title).trim();
      if (r.details !== undefined) t.details = String(asVal(r.details) ?? t.details);
      if (r.completed !== undefined) {
        const willComplete = !!asVal(r.completed);
        if (!t.completed && willComplete) { t.completed = true; t.completedAt = now; }
        else if (t.completed && !willComplete) { t.completed = false; t.completedAt = ''; }
      }
      if (r.completionReason !== undefined) t.completionReason = String(asVal(r.completionReason) ?? t.completionReason);
      if (r.completionSignature !== undefined) t.completionSignature = String(asVal(r.completionSignature) ?? t.completionSignature);
      t.updatedAt = now;
      cb(null, mapTask(t));
    },
    Delete: (call, cb) => {
      const id = Number(call.request?.id);
      const idx = findIndexById(id);
      if (idx === -1) return cb({ code: grpc.status.NOT_FOUND, message: 'Not found' });
      tasks.splice(idx, 1);
      cb(null, { ok: true });
    },
    BulkDelete: (call, cb) => {
      const ids = (call.request?.ids || []).map(Number);
      let deleted = 0;
      for (const id of ids) {
        const idx = findIndexById(id);
        if (idx !== -1) { tasks.splice(idx, 1); deleted++; }
      }
      cb(null, { deleted });
    }
  };

  const server = new grpc.Server();
  server.addService(tasksPkg.Tasks.service, handlers);

  const host = process.env.GRPC_HOST || '0.0.0.0';
  const port = Number(process.env.GRPC_PORT || 50051);

  await new Promise((resolve, reject) => {
    server.bindAsync(`${host}:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
      if (err) return reject(err);
      server.start();
      console.log(`gRPC running on ${host}:${boundPort}`);
      resolve();
    });
  });

  return server;
}

// Auto-start if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startGrpc().catch((e) => {
    console.error('gRPC failed to start:', e);
    process.exit(1);
  });
}