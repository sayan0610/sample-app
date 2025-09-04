import { useState } from 'react';

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const t = title.trim();
    const d = details.trim();
    if (!t) return setError('Title required');
    try {
      // Pass object (adjust useTasks/addTask if it still expects only a string)
      await onAdd({ title: t, details: d || null });
      setTitle('');
      setDetails('');
      setError('');
    } catch (err) {
      setError(err.message || 'Add failed');
    }
  }

  return (
    <div className="create-box">
      <h2 className="create-heading">Add Task</h2>
      <form onSubmit={submit} className="create-form">
        <div className="cf-field">
          <label htmlFor="new-title">Title</label>
          <input
            id="new-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title"
            required
          />
        </div>
        <div className="cf-field">
          <label htmlFor="new-details">Details</label>
            <textarea
              id="new-details"
              rows={4}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Optional details"
            />
        </div>
        {error && <div className="cf-error">{error}</div>}
        <button type="submit" className="cf-add-btn">Add Task</button>
      </form>
    </div>
  );
}