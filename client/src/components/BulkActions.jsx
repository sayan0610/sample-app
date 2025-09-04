export default function BulkActions({ count, onDelete, onComplete, onIncomplete }) {
  const disabled = count <= 1;
  return (
    <div className="bulk-actions">
      <button disabled={disabled} onClick={onDelete}>Bulk Delete</button>
      <button disabled={disabled} onClick={onComplete}>Mark Completed</button>
      <button disabled={disabled} onClick={onIncomplete}>Mark In-Progress</button>
      <span className="bulk-count">{count > 0 ? `${count} selected` : ''}</span>
    </div>
  );
}