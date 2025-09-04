import { useState, useEffect } from 'react';
import Modal from './Modal.jsx';

export default function TaskEditModal({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || '');
  const [details, setDetails] = useState(task?.details || '');
  const [completed, setCompleted] = useState(!!task?.completed);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDetails(task.details || '');
      setCompleted(!!task.completed);
      setError('');
    }
  }, [task]);

  if (!task) return null;

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');
    try {
      await onSave(task.id, { title: title.trim(), details: details.trim(), completed });
      onClose();
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  }

  return (
    <Modal title="Edit Task" onClose={onClose}>
      <form className="m-form" onSubmit={submit}>
        <div className="m-field">
          <label>Title</label>
          <input
            data-autofocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Task title"
          />
        </div>
        <div className="m-field">
          <label>Details</label>
          <textarea
            rows={5}
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Optional details"
          />
        </div>
        <div className="m-inline">
          <input
            id="task-edit-completed"
            type="checkbox"
            checked={completed}
            onChange={e => setCompleted(e.target.checked)}
          />
          <label htmlFor="task-edit-completed" className="m-inline-label">Completed</label>
        </div>
        {error && <div className="m-error">{error}</div>}
        <div className="m-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}