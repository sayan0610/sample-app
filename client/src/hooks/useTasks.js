import { useCallback, useEffect, useRef, useState } from 'react';
import { TaskService } from '../services/TaskServiceGrpcWeb';

const service = TaskService;

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError('');
    try {
      const list = await service.list(ctrl.signal);
      setTasks(list);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const guarded = async (fn) => {
    try { return await fn(); }
    catch (e) { setError(e.message); throw e; }
  };

  const addTask = useCallback((input) => guarded(async () => {
    const newTask = await service.create(
      typeof input === 'string' ? { title: input, details: null } : input
    );
    setTasks(t => [newTask, ...t]);
  }), []);

  const updateTask = useCallback((id, patch) => guarded(async () => {
    setTasks(t => t.map(tsk => tsk.id === id ? tsk.withChanges(patch) : tsk));
    try {
      const saved = await service.update(id, patch);
      setTasks(t => t.map(tsk => tsk.id === id ? saved : tsk));
    } catch (e) {
      await load(); // rollback by reload
      throw e;
    }
  }), [load]);

  const deleteTask = useCallback((id) => guarded(async () => {
    const prev = tasks;
    setTasks(t => t.filter(tsk => tsk.id !== id));
    try {
      await service.remove(id);
    } catch (e) {
      setTasks(prev); throw e;
    }
  }), [tasks]);

  const bulkStatus = useCallback((ids, completed) => guarded(async () => {
    const idSet = new Set(ids);
    setTasks(t => t.map(tsk => idSet.has(tsk.id) ? tsk.withChanges({ completed }) : tsk));
    try {
      const updated = await service.bulkStatus(ids, completed);
      const map = new Map(updated.map(u => [u.id, u]));
      setTasks(t => t.map(tsk => map.get(tsk.id) || tsk));
    } catch (e) {
      await load(); throw e;
    }
  }), [load]);

  const bulkDelete = useCallback((ids) => guarded(async () => {
    const idSet = new Set(ids);
    const prev = tasks;
    setTasks(t => t.filter(tsk => !idSet.has(tsk.id)));
    try {
      await service.bulkDelete(ids);
    } catch (e) {
      setTasks(prev); throw e;
    }
  }), [tasks]);

  const visible = tasks.filter(t =>
    !filter.trim() ||
    t.title.toLowerCase().includes(filter.toLowerCase())
  );

  return {
    tasks: visible,
    rawTasks: tasks,
    filter,
    setFilter,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    bulkStatus,
    bulkDelete,
    reload: load
  };
}