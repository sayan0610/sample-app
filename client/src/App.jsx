import React, { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks.js';
import AddTaskModal from './components/AddTaskModal.jsx';
import FilterBar from './components/FilterBar.jsx';
import BulkActions from './components/BulkActions.jsx';
import TaskTable from './components/TaskTable.jsx';
import TaskEditModal from './components/TaskEditModal.jsx';
import CompleteTaskModal from './components/CompleteTaskModal.jsx';

export default function App() {
  const {
    tasks, filter, setFilter, loading, error,
    addTask, updateTask, deleteTask, bulkStatus, bulkDelete
  } = useTasks();

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    console.debug('[App] tasks prop', tasks);
  }, [tasks]);

  function handleSelectOne(id, checked) {
    setSelectedIds(p => {
      const n = new Set(p);
      checked ? n.add(id) : n.delete(id);
      return n;
    });
  }
  function handleSelectAll(checked) {
    setSelectedIds(checked ? new Set(tasks.map(t => t.id)) : new Set());
  }

  async function toggleTask(task) {
    await updateTask(task.id, { completed: !task.completed });
    setSelectedIds(new Set());
  }

  async function renameTask(id, title) {
    await updateTask(id, { title });
  }

  async function bulkComplete() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    await bulkStatus(ids, true);
    setSelectedIds(new Set());
  }
  async function bulkDeleteAction() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    await bulkDelete(ids);
    setSelectedIds(new Set());
  }

  function handleEdit(task) { setEditingTask(task); }
  function closeEdit() { setEditingTask(null); }
  async function saveModal(id, payload) { await updateTask(id, payload); }

  function handleRequestComplete(task) { setCompletingTask(task); }
  async function handleConfirmComplete({ reason, signature }) {
    await updateTask(completingTask.id, {
      completed: true,
      completionReason: reason,
      completionSignature: signature
    });
    setCompletingTask(null);
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="brand-title">
            <span className="brand-accent">Task</span>
            <span className="brand-light">Manager</span>
          </h1>
          <div className="app-header-tools">
            <FilterBar
              value={filter}
              onChange={v => { setFilter(v); setSelectedIds(new Set()); }}
            />
            <button
              className="add-task-trigger fancy-add-btn"
              onClick={() => setShowAddModal(true)}
              type="button"
            >
              <span className="btn-icon" aria-hidden="true">＋</span>
              <span>Add New Task</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <BulkActions
          count={selectedIds.size}
          onDelete={bulkDeleteAction}
          onComplete={bulkComplete}
        />
        <div aria-live="polite" className="sr-live">
          {loading && <div className="info-banner">Loading tasks…</div>}
          {error && <div className="error-banner">{error}</div>}
        </div>
        <TaskTable
          tasks={tasks}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onRenameTask={renameTask}
          onEdit={handleEdit}
          onRequestComplete={handleRequestComplete}
        />
      </main>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={closeEdit}
          onSave={saveModal}
        />
      )}
      {completingTask && (
        <CompleteTaskModal
          task={completingTask}
          onCancel={() => setCompletingTask(null)}
          onConfirm={handleConfirmComplete}
        />
      )}
      {showAddModal && (
        <AddTaskModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={addTask}
        />
      )}
    </>
  );
}