export default function FilterBar({ value, onChange }) {
  return (
    <div className="filter-bar">
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="all">All</option>
        <option value="completed">Completed</option>
        <option value="incomplete">In-Progress</option>
      </select>
    </div>
  );
}