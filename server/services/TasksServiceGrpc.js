import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'node:path';

const PROTO_PATH = path.resolve(process.cwd(), 'API/grpc/tasks.proto');

const loaderOpts = { keepCase: true, longs: String, enums: String, defaults: false, oneofs: true, includeDirs: [path.dirname(PROTO_PATH)] };

function promisify(client, method, req) {
  return new Promise((resolve, reject) => client[method](req, (err, res) => (err ? reject(err) : resolve(res))));
}

export default class TasksServiceGrpc {
  constructor(addr = process.env.GRPC_ADDR || '127.0.0.1:50051') {
    this.addr = addr;
    this.client = null;
    this.ready = this._createClient();
  }
  async _createClient() {
    const packageDef = await protoLoader.load(PROTO_PATH, loaderOpts);
    const proto = grpc.loadPackageDefinition(packageDef);
    const TasksClient = proto.tasks.Tasks;
    this.client = new TasksClient(this.addr, grpc.credentials.createInsecure());
  }
  async list(filter = 'all', page, pageSize) {
    await this.ready;
    const res = await promisify(this.client, 'List', { filter, page: page || 0, pageSize: pageSize || 0 });
    return res.items || [];
  }
  async get(id) { await this.ready; return promisify(this.client, 'Get', { id: Number(id) }); }
  async create({ title, details }) { await this.ready; return promisify(this.client, 'Create', { title, details: details ?? '' }); }
  async update(id, { title, details, completed }) { await this.ready; return promisify(this.client, 'Update', { id: Number(id), title, details: details ?? '', completed: !!completed }); }
  async patch(id, body = {}) {
    await this.ready;
    const req = { id: Number(id) };
    if ('title' in body) req.title = body.title ?? '';
    if ('details' in body) req.details = body.details ?? '';
    if ('completed' in body) req.completed = !!body.completed;
    if ('completionReason' in body) req.completionReason = body.completionReason ?? '';
    if ('completionSignature' in body) req.completionSignature = body.completionSignature ?? '';
    return promisify(this.client, 'Patch', req);
  }
  async remove(id) { await this.ready; const res = await promisify(this.client, 'Delete', { id: Number(id) }); return !!res.ok; }
  async bulkDelete(ids = []) { await this.ready; const res = await promisify(this.client, 'BulkDelete', { ids: ids.map(Number) }); return res.deleted || 0; }
}