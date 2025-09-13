import { useMemo, useState } from 'react';
import TaskRow from './TaskRow.jsx';

export default function TaskTable({
  tasks = [],
  selectedIds = new Set(),
  onSelectAll,
  onSelectOne,
  onEdit,
  onDeleteTask,
  onRequestComplete,
  onBulkComplete,
  onBulkDelete,
  onFilterChange,
  filterValue
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // NEW: 10 | 20 | 50 | 100
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const total = tasks.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const sortedTasks = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...tasks].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -dir;
      if (a[sortBy] > b[sortBy]) return dir;
      return 0;
    });
  }, [tasks, sortBy, sortDir]);

  const pageTasks = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, clampedPage, pageSize]);

  const selectedCount = selectedIds?.size || 0;
  const pageSelectedCount = pageTasks.filter(t => selectedIds?.has?.(t.id)).length;
  const pageAllChecked = pageTasks.length > 0 && pageSelectedCount === pageTasks.length;

  const showingStart = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const showingEnd = Math.min(clampedPage * pageSize, total);

  const goto = (p) => setPage(Math.min(Math.max(1, p), totalPages));
  const onChangePageSize = (e) => {
    const next = parseInt(e.target.value, 10);
    setPageSize(next);
    setPage(1); // reset to first page when page size changes
  };
  const toggleSort = (newSortBy) => {
    const newSortDir = sortBy === newSortBy && sortDir === 'asc' ? 'desc' : 'asc';
    setSortBy(newSortBy);
    setSortDir(newSortDir);
  };

  return (
    <>
      <div className="pagination top" role="region" aria-label="Task controls and pagination">
        <div className="top-left-cluster" style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div className="filter-bar inline">
            <select value={filterValue} onChange={e=>onFilterChange && onFilterChange(e.target.value)} aria-label="Filter tasks">
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="incomplete">In-Progress</option>
            </select>
          </div>
          <span className="ba-count" aria-live="polite">{selectedCount} selected</span>
          <button
            type="button"
            className="ba-btn primary"
            onClick={onBulkComplete}
            disabled={selectedCount===0}
            aria-disabled={selectedCount===0}
          >Complete</button>
          <button
            type="button"
            className="ba-btn danger"
            onClick={onBulkDelete}
            disabled={selectedCount===0}
            aria-disabled={selectedCount===0}
          >Delete</button>
        </div>
        <div className="page-size">
          <label>
            <span className="sr-only">Items per page</span>
            <select value={pageSize} onChange={onChangePageSize} aria-label="Items per page">
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
              <option value={50}>Show 50</option>
              <option value={100}>Show 100</option>
            </select>
          </label>
        </div>

  <span className="page-info">Showing {showingStart}–{showingEnd} of {total}</span>

        <div className="page-controls">
          <button className="page-btn" onClick={() => goto(1)} disabled={clampedPage === 1} aria-label="First page">«</button>
          <button className="page-btn" onClick={() => goto(clampedPage - 1)} disabled={clampedPage === 1} aria-label="Previous page">‹</button>
          {makePageWindow(clampedPage, totalPages).map(p => (
            <button
              key={p}
              className="page-btn"
              aria-current={p === clampedPage ? 'page' : undefined}
              onClick={() => goto(p)}
            >
              {p}
            </button>
          ))}
          <button className="page-btn" onClick={() => goto(clampedPage + 1)} disabled={clampedPage === totalPages} aria-label="Next page">›</button>
          <button className="page-btn" onClick={() => goto(totalPages)} disabled={clampedPage === totalPages} aria-label="Last page">»</button>
        </div>
      </div>

      <div className="table-wrapper" data-theme="mint">
        <table id="task-table" className="task-table">
          <thead>
            <tr>
              <th scope="col">
                <input
                  aria-label="Select all on page"
                  type="checkbox"
                  checked={pageAllChecked}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                />
              </th>
              <ThSort label="Title" active={sortBy === 'title'} dir={sortDir} onClick={() => toggleSort('title')} />
              <th scope="col" className="col-details">Details</th>
              <ThSort label="Status" active={sortBy === 'completed'} dir={sortDir} onClick={() => toggleSort('completed')} />
              <ThSort label="Created" active={sortBy === 'createdAt'} dir={sortDir} onClick={() => toggleSort('createdAt')} className="col-created" />
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageTasks.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 18, textAlign: 'center', color: 'var(--c-text-dim)' }}>
                  No tasks found.
                </td>
              </tr>
            )}
            {pageTasks.map((t) => {
              const isSelected = selectedIds?.has?.(t.id);
              return (
                <TaskRow
                  key={t.id}
                  task={t}
                  selected={isSelected}
                  onSelectChange={onSelectOne}
                  onEdit={onEdit}
                  onDelete={onDeleteTask}
                  onRequestComplete={onRequestComplete}
                >
                  <button
                    type="button"
                    className="action-btn edit"
                    onClick={() => onEdit && onEdit(t)}
                    title="Edit"
                  >
                    Edit
                  </button>
                  {!t.completed ? (
                    <button
                      type="button"
                      className="action-btn complete"
                      onClick={() => onRequestComplete && onRequestComplete(t)}
                      title="Mark complete"
                    >
                      Complete
                    </button>
                  ) : (
                    <span className="action-btn hidden-complete" aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    className="action-btn delete"
                    onClick={() => onDeleteTask && onDeleteTask(t.id)}
                    title="Delete"
                  >
                    Delete
                  </button>
                </TaskRow>
              );
            })}
          </tbody>
        </table>
      </div>

  <div className="pagination bottom" role="region" aria-label="Task pagination">
        <div className="page-size">
          <label>
            <span className="sr-only">Items per page</span>
            <select value={pageSize} onChange={onChangePageSize} aria-label="Items per page">
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
              <option value={50}>Show 50</option>
              <option value={100}>Show 100</option>
            </select>
          </label>
        </div>

        <span className="page-info">
          Showing {showingStart}–{showingEnd} of {total}
        </span>

        <div className="page-controls">
          <button className="page-btn" onClick={() => goto(1)} disabled={clampedPage === 1} aria-label="First page">«</button>
          <button className="page-btn" onClick={() => goto(clampedPage - 1)} disabled={clampedPage === 1} aria-label="Previous page">‹</button>
          {makePageWindow(clampedPage, totalPages).map(p => (
            <button
              key={p}
              className="page-btn"
              aria-current={p === clampedPage ? 'page' : undefined}
              onClick={() => goto(p)}
            >
              {p}
            </button>
          ))}
          <button className="page-btn" onClick={() => goto(clampedPage + 1)} disabled={clampedPage === totalPages} aria-label="Next page">›</button>
          <button className="page-btn" onClick={() => goto(totalPages)} disabled={clampedPage === totalPages} aria-label="Last page">»</button>
        </div>
      </div>
    </>
  );
}

function ThSort({ label, active, dir, onClick, className }) {
  const ariaSort = active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined;
  return (
  <th scope="col" className={["th-sort", className].filter(Boolean).join(' ')} aria-sort={ariaSort}>
      <button type="button" className="th-sort-btn" onClick={onClick} aria-label={`Sort by ${label}${active ? `, ${dir}` : ''}`}>
        {label}
      </button>
    </th>
  );
}

function makePageWindow(current, total, size = 5) {
  const half = Math.floor(size / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + size - 1);
  if (end - start + 1 < size) start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}