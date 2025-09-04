import { useState } from 'react';

export default function TaskRow({
  task,
  selected,
  onSelectChange,
  onToggle,
  onDelete,
  onRename
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  function save() {
    if (draft.trim() && draft !== task.title) onRename(task.id, draft.trim());
    setEditing(false);
  }

  return (
    <>
      <tr className={task.completed ? 'row-completed' : ''}>
        <td>
          <label className="custom-checkbox">
            <input
              type="checkbox"
              checked={selected}
              onChange={e => onSelectChange(task.id, e.target.checked)}
            />
            <span className="checkmark" />
          </label>
        </td>
        <td>
          {!editing && (
            <span
              className="task-title"
              style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
              onClick={() => setExpanded(v => !v)}
            >
              {task.title}
            </span>
          )}
          {editing && (
            <span className="edit-inline">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') save();
                  if (e.key === 'Escape') { setEditing(false); setDraft(task.title); }
                }}
                autoFocus
              />
              <button onClick={save}>Save</button>
              <button onClick={() => { setEditing(false); setDraft(task.title); }}>Cancel</button>
            </span>
          )}
        </td>
        <td>
          <span className={`status-badge ${task.completed ? 'status-completed' : 'status-inprogress'}`}>
            {task.completed ? 'Completed' : 'In-Progress'}
          </span>
        </td>
        <td className="actions">
          <button
            title={task.completed ? 'Undo' : 'Complete'}
            aria-label={task.completed ? 'Mark as In-Progress' : 'Mark Complete'}
            className={task.completed ? 'pending-btn' : 'complete-btn'}
            onClick={() => onToggle(task)}
          >
            {task.completed ? '↺' : '✔'}
          </button>
          <button
            title="Delete"
            aria-label="Delete task"
            className="delete-btn"
            onClick={() => onDelete(task.id)}
          >
            <svg
              className="icon-trash"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              role="img"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M9 3h6l1 2h5v2H3V5h5l1-2Zm-2 6h2v10H7V9Zm8 0h2v10h-2V9ZM11 9h2v10h-2V9Z"
              />
            </svg>
          </button>
          <button
            title="Rename"
            aria-label="Rename task"
            className="edit-btn"
            onClick={() => setEditing(true)}
          >
            ✎
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="detail-row">
          <td colSpan="4">
            {task.details ? <><strong>Details:</strong> {task.details}</> : <em>No details.</em>}
          </td>
        </tr>
      )}
    </>
  );
}