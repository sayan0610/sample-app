import TaskRow from './TaskRow.jsx';

export default function TaskTable({
  tasks,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onToggleTask,
  onDeleteTask,
  onRenameTask
}) {
  const allChecked = tasks.length > 0 && tasks.every(t => selectedIds.has(t.id));
  return (
    <div className="table-wrapper">
      <table id="task-table">
        <thead>
          <tr>
            <th style={{ width: 52 }}>
              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={e => onSelectAll(e.target.checked)}
                />
                <span className="checkmark" />
              </label>
            </th>
            <th>Title</th>
            <th>Status</th>
            <th style={{ width: 140 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              selected={selectedIds.has(t.id)}
              onSelectChange={onSelectOne}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onRename={onRenameTask}
            />
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '24px 12px' }}>
                No tasks.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}