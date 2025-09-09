import { HttpClient } from './httpClient.js';
import { Task } from '../domain/Task.js';

const BASE = import.meta.env.VITE_API_URL || '';

export class TaskService {
  constructor(client = new HttpClient(BASE)) {
    this.client = client;
  }
  async list(signal) {
    const data = await this.client.get('/api/tasks', { signal });
    return data.map(r => new Task(r));
  }
  async create({ title, details }) {
    const payload = Task.sanitizeInput({ title, details });
    const data = await this.client.post('/api/tasks', payload);
    return new Task(data);
  }
  async update(id, patch) {
    const data = await this.client.patch(`/api/tasks/${id}`, patch);
    return new Task(data);
  }
  async bulkStatus(ids, completed) {
    const data = await this.client.patch('/api/tasks/bulk', { ids, completed });
    return data.map(r => new Task(r));
  }
  async bulkDelete(ids) {
    await this.client.patch('/api/tasks/bulk-delete', { ids });
  }
  async remove(id) {
    await this.client.delete(`/api/tasks/${id}`);
  }
}