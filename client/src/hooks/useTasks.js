import { useCallback, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const API_URL = `${API_BASE.replace(/\/+$/,'')}/api/tasks`;

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API_URL}?filter=${filter}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setTasks(data);
    } catch (e) {
      setError(e.message || 'Fetch error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function addTask(input) {
    const payload = typeof input === 'string'
      ? { title: input }
      : { title: input.title, details: input.details ?? null };

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Create failed');
    const data = await res.json();
    setTasks(t => [data, ...t]);
  }

  async function updateTask(id, patch) {
    const r = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (!r.ok) throw new Error('Update failed');
    fetchTasks();
  }

  async function replaceTask(id, body) {
    const r = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('Replace failed');
    fetchTasks();
  }

  async function deleteTask(id) {
    const r = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete failed');
    fetchTasks();
  }

  async function bulkStatus(ids, completed) {
    await fetch(`${API_URL}/bulk/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, completed })
    });
    fetchTasks();
  }

  async function bulkDelete(ids) {
    await fetch(`${API_URL}/bulk/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    fetchTasks();
  }

  return {
    tasks,
    filter,
    setFilter,
    loading,
    error,
    addTask,
    updateTask,
    replaceTask,
    deleteTask,
    bulkStatus,
    bulkDelete,
    refetch: fetchTasks
  };
}