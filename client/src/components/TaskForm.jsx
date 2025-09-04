import { useState } from 'react';

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const disabled = !title.trim();

  async function submit(e) {
    e.preventDefault();
    if (disabled) return;
    await onAdd(title.trim(), details.trim());
    setTitle('');
    setDetails('');
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <input
        placeholder="Task title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <input
        placeholder="Details (optional)"
        value={details}
        onChange={e => setDetails(e.target.value)}
      />
      <button disabled={disabled}>Add Task</button>
    </form>
  );
}