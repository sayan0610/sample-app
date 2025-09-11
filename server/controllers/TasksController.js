import TasksService from '../services/TasksService.js';
import TasksServiceGrpc from '../services/TasksServiceGrpc.js';

const useGrpc = String(process.env.USE_GRPC || '').toLowerCase() === 'true';

export default class TasksController {
  constructor() {
    this.service = useGrpc ? new TasksServiceGrpc() : new TasksService();
  }

  list = async (req, res, next) => {
    try {
      const filter = req.query.filter || 'all';
      const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
      const items = await this.service.list(filter, page, pageSize);
      res.json(items);
    } catch (e) { next(e); }
  };

  get = async (req, res, next) => {
    try {
      const t = await this.service.get(Number(req.params.id));
      if (!t) return res.status(404).json({ error: 'Not found' });
      res.json(t);
    } catch (e) { next(e); }
  };

  create = async (req, res, next) => {
    try {
      const { title, details } = req.body || {};
      if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title required' });
      const t = await this.service.create({ title, details });
      res.status(201).json(t);
    } catch (e) { next(e); }
  };

  update = async (req, res, next) => {
    try {
      const { title, details, completed } = req.body || {};
      if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title required' });
      const t = await this.service.update(Number(req.params.id), { title, details, completed });
      if (!t) return res.status(404).json({ error: 'Not found' });
      res.json(t);
    } catch (e) { next(e); }
  };

  patch = async (req, res, next) => {
    try {
      const t = await this.service.patch(Number(req.params.id), req.body || {});
      if (!t) return res.status(404).json({ error: 'Not found' });
      res.json(t);
    } catch (e) { next(e); }
  };

  remove = async (req, res, next) => {
    try {
      const ok = await this.service.remove(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    } catch (e) { next(e); }
  };

  bulkDelete = async (req, res, next) => {
    try {
      const raw = req.body?.ids;
      const ids = Array.isArray(raw) ? [...new Set(raw.map((n) => Number(n)).filter(Number.isInteger))] : [];
      if (ids.length === 0) return res.status(400).json({ error: 'ids must be a non-empty array of integers' });
      const deleted = await this.service.bulkDelete(ids);
      res.json({ deleted });
    } catch (e) { next(e); }
  };
}