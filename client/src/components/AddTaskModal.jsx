import { useState } from 'react';
import Modal from './Modal.jsx';

export default function AddTaskModal({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return setError('Title required');
    try {
      await onAdd({ title: t, details: details.trim() || null });
      setTitle('');
      setDetails('');
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || 'Add failed');
    }
  }

  return (
    <Modal title="Add New Task" onClose={onClose}>
      <form className="m-form" onSubmit={submit}>
        <div className="m-field">
          <label>Title</label>
          <input
            data-autofocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title"
            required
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
        {error && <div className="m-error">{error}</div>}
        <div className="m-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create</button>
        </div>
      </form>
    </Modal>
  );
}