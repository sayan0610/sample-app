export default function BulkActions({ count, onDelete, onComplete }) {
  const disabled = count === 0;
  return (
    <div className="bulk-actions" role="region" aria-label="Bulk actions">
      <span className="ba-count" aria-live="polite">{count} selected</span>
      <div className="ba-spacer" />
      <button
        type="button"
        className="ba-btn primary"
        onClick={onComplete}
        disabled={disabled}
        aria-disabled={disabled}
      >
        Complete
      </button>
      <button
        type="button"
        className="ba-btn danger"
        onClick={onDelete}
        disabled={disabled}
        aria-disabled={disabled}
      >
        Delete
      </button>
    </div>
  );
}