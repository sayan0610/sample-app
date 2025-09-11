import TasksRepository from '../repositories/TasksRepository.js';

export default class TasksService {
  constructor() { this.repo = new TasksRepository(); }

  mapRow(r) {
    return {
      id: r.id,
      title: r.title,
      details: r.description ?? null,
      completed: r.status === 'completed',
      completionReason: r.completion_reason ?? null,
      completionSignature: r.completion_signature ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      completedAt: r.completed_at
    };
  }

  async list(filter = 'all') {
    const rows = await this.repo.findAll(filter);
    return rows.map((r) => this.mapRow(r));
  }

  async get(id) {
    const row = await this.repo.findById(id);
    return row ? this.mapRow(row) : null;
  }

  async create({ title, details }) {
    const t = String(title).trim();
    if (!t) { const e = new Error('Title required'); e.status = 400; throw e; }
    if (t.length > 255) { const e = new Error('Title too long'); e.status = 400; throw e; }
    const row = await this.repo.insert({ title: t, description: details ? String(details).trim() : null });
    return this.mapRow(row);
  }

  async update(id, { title, details, completed }) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    const nextStatus = completed === true ? 'completed' : 'pending';
    if (existing.status === 'completed' && nextStatus !== 'completed') {
      const err = new Error('Completed tasks cannot be reverted to pending'); err.status = 400; throw err;
    }

    const row = await this.repo.updateFull(id, {
      title: String(title).trim(),
      description: details ? String(details).trim() : null,
      status: nextStatus
    });
    return this.mapRow(row);
  }

  async patch(id, body) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    const fields = {};
    if (body.title !== undefined) fields.title = String(body.title).trim();
    if (body.details !== undefined) fields.description = body.details ? String(body.details).trim() : null;

    // Completed logic
    if (body.completed !== undefined) {
      const toCompleted = body.completed === true;
      if (!toCompleted && existing.status === 'completed') {
        const err = new Error('Completed tasks cannot be reverted to pending'); err.status = 400; throw err;
      }
      fields.status = toCompleted ? 'completed' : 'pending';
      if (toCompleted) {
        fields.completed_at = existing.status === 'completed' ? existing.completed_at : 'NOW()';
        if (body.completionReason !== undefined) fields.completion_reason = body.completionReason;
        if (body.completionSignature !== undefined) fields.completion_signature = body.completionSignature;
      } else {
        fields.completion_reason = null;
        fields.completion_signature = null;
        fields.completed_at = null;
      }
    } else {
      if (body.completionReason !== undefined) fields.completion_reason = body.completionReason;
      if (body.completionSignature !== undefined) fields.completion_signature = body.completionSignature;
    }

    const row = await this.repo.updatePartial(id, fields);
    return this.mapRow(row);
  }

  async remove(id) {
    const count = await this.repo.deleteById(id);
    return count > 0;
  }

  async bulkDelete(ids) {
    return this.repo.bulkDelete(ids);
  }
}