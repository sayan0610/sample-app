import { useState } from 'react';
import { useTasks } from './hooks/useTasks.js';
import TaskForm from './components/TaskForm.jsx';
import FilterBar from './components/FilterBar.jsx';
import BulkActions from './components/BulkActions.jsx';
import TaskTable from './components/TaskTable.jsx';

export default function App() {
  const {
    tasks, filter, setFilter, loading, error,
    addTask, updateTask, deleteTask, bulkStatus, bulkDelete
  } = useTasks();

  const [selectedIds, setSelectedIds] = useState(new Set());

  function handleSelectOne(id, checked) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  function handleSelectAll(checked) {
    if (!checked) { setSelectedIds(new Set()); return; }
    setSelectedIds(new Set(tasks.map(t => t.id)));
  }

  async function toggleTask(task) {
    await updateTask(task.id, { completed: !task.completed });
    setSelectedIds(new Set()); // reset selection after action
  }

  async function renameTask(id, title) {
    await updateTask(id, { title });
  }

  async function bulkComplete() {
    const ids = Array.from(selectedIds);
    await bulkStatus(ids, true);
    setSelectedIds(new Set());
  }

  async function bulkIncomplete() {
    const ids = Array.from(selectedIds);
    await bulkStatus(ids, false);
    setSelectedIds(new Set());
  }

  async function bulkDeleteAction() {
    const ids = Array.from(selectedIds);
    await bulkDelete(ids);
    setSelectedIds(new Set());
  }

  return (
    <div className="app-shell">
      <h1>Task Manager</h1>

      <div className="top-bar">
        <TaskForm onAdd={addTask} />
        <FilterBar value={filter} onChange={v => { setFilter(v); setSelectedIds(new Set()); }} />
      </div>

      <BulkActions
        count={selectedIds.size}
        onDelete={bulkDeleteAction}
        onComplete={bulkComplete}
        onIncomplete={bulkIncomplete}
      />

      {loading && <div className="info-banner">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}

      <TaskTable
        tasks={tasks}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
        onRenameTask={renameTask}
      />
    </div>
  );
}