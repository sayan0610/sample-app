import React, { useState } from 'react';
import MoreMenu from './MoreMenu.jsx';

export default function TaskRow({
  task,
  selected,
  onSelectChange,
  onToggle,
  onDelete,
  onRename,
  onEdit,
  onRequestComplete
}) {
  const [expanded, setExpanded] = useState(false);

  function handleCompleteClick() {
    if (!task.completed) {
      onRequestComplete && onRequestComplete(task);
    }
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
          <span
            className="task-title"
            style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
            onClick={() => setExpanded(v => !v)}
          >
            {task.title}
          </span>
        </td>
        <td className="td-details">
          {task.details ? <span className="details-ellipsis">{task.details}</span> : <span className="details-ellipsis text-dim">—</span>}
        </td>
        <td>
          <span className={`status-badge ${task.completed ? 'status-completed' : 'status-inprogress'}`}>
            {task.completed ? 'Completed' : 'In-Progress'}
          </span>
        </td>
        <td className="td-created">
          {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—'}
        </td>
        <td className="actions">
          <div className="actions-desktop">
          <button
            title={task.completed ? 'Completed' : 'Mark Complete'}
            aria-label={task.completed ? 'Completed' : 'Mark Complete'}
            className={`action-btn complete-btn ${task.completed ? 'hidden-complete' : ''}`}
            disabled={task.completed}
            onClick={handleCompleteClick}
          >
            ✔
          </button>
          <button
            title="Delete"
            aria-label="Delete task"
            className="delete-btn action-btn"
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
            title="Edit"
            aria-label="Edit task"
            className="edit-btn action-btn"
            onClick={() => onEdit(task)}
          >
            ✎
          </button>
          </div>
          <div className="actions-mobile">
            <MoreMenu
              completed={task.completed}
              onComplete={handleCompleteClick}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
            />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="detail-row">
          <td colSpan="6">
            {task.details ? <><strong>Details:</strong> {task.details}</> : <em>No details.</em>}
            {task.completed && (task.completionReason || task.completionSignature) && (
              <div className="completion-audit">
                <strong>Completion Audit:</strong><br/>
                {task.completedAt && <>At: {new Date(task.completedAt).toLocaleString()}<br/></>}
                {task.completionReason && <>Reason: {task.completionReason}<br/></>}
                {task.completionSignature && <>Signature: {task.completionSignature}</>}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}