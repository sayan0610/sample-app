import { Task } from '../domain/Task.js';
import servicesMod from 'proto-stubs/tasks_grpc_web_pb.js';
import pbMod from 'proto-stubs/tasks_pb.js';
import { StringValue, BoolValue } from 'google-protobuf/google/protobuf/wrappers_pb.js';
const services = servicesMod.default || servicesMod;
const pb = pbMod.default || pbMod;

const endpoint = import.meta.env.VITE_GRPC_WEB_ENDPOINT || 'http://localhost:8080';
const client = new services.TasksClient(endpoint, null, null);

function getAuthMetadata() {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return {};
    const u = JSON.parse(raw);
    if (u && u.token) return { Authorization: `Bearer ${u.token}` };
  } catch {}
  return {};
}

function call(method, req) {
  return new Promise((resolve, reject) => {
    client[method](req, getAuthMetadata(), (err, res) => (err ? reject(err) : resolve(res)));
  });
}

const toTask = (msg) => {
  const o = msg.toObject();
  return {
    id: o.id,
    title: o.title,
    details: o.details || null,
    completed: !!o.completed,
    completionReason: o.completionreason ?? null,
    completionSignature: o.completionsignature ?? null,
    createdAt: o.createdat ?? null,
    updatedAt: o.updatedat ?? null,
    completedAt: o.completedat ?? null
  };
};

export const TaskService = {
  async list({ filter = 'all', page, pageSize } = {}) {
    const req = new pb.ListRequest();
    if (filter) req.setFilter(filter);
    if (page) req.setPage(page);
    if (pageSize) req.setPagesize(pageSize);
  const res = await call('list', req);
  return res.getItemsList().map(toTask).map(t => new Task(t));
  },
  async get(id) {
    const req = new pb.GetRequest();
    req.setId(Number(id));
  const res = await call('get', req);
  return new Task(toTask(res));
  },
  async create({ title, details }) {
    const req = new pb.CreateRequest();
    req.setTitle(title);
    req.setDetails(details || '');
  const res = await call('create', req);
  return new Task(toTask(res));
  },
  async update(id, { title, details, completed }) {
    const req = new pb.UpdateRequest();
    req.setId(Number(id));
    req.setTitle(title);
    req.setDetails(details || '');
    req.setCompleted(!!completed);
  const res = await call('update', req);
  return new Task(toTask(res));
  },
  async patch(id, body = {}) {
    const req = new pb.PatchRequest();
    req.setId(Number(id));
  if ('title' in body) { const v = new StringValue(); v.setValue(body.title || ''); req.setTitle(v); }
  if ('details' in body) { const v = new StringValue(); v.setValue(body.details || ''); req.setDetails(v); }
  if ('completed' in body) { const v = new BoolValue(); v.setValue(!!body.completed); req.setCompleted(v); }
  if ('completionReason' in body) { const v = new StringValue(); v.setValue(body.completionReason || ''); req.setCompletionreason(v); }
  if ('completionSignature' in body) { const v = new StringValue(); v.setValue(body.completionSignature || ''); req.setCompletionsignature(v); }
  const res = await call('patch', req);
  return new Task(toTask(res));
  },
  async remove(id) {
    const req = new pb.DeleteRequest();
    req.setId(Number(id));
    const res = await call('delete', req);
    return res.getOk();
  },
  async bulkDelete(ids) {
    const req = new pb.BulkDeleteRequest();
    req.setIdsList(ids.map(Number));
  const res = await call('bulkDelete', req);
    return res.getDeleted();
  },
  async bulkStatus(ids, completed) {
    // emulate via sequential updates to keep API minimal
    const updated = [];
    for (const id of ids) {
      updated.push(await this.patch(id, { completed }));
    }
    return updated;
  }
};