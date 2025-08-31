window.bulkCompleteSelected = async function(complete) {
  // Only update checked tasks that are currently visible (rendered in DOM)
  const visibleCheckedBoxes = Array.from(document.querySelectorAll('#task-list li .bulk-checkbox:checked'));
  for (const cb of visibleCheckedBoxes) {
    const id = cb.getAttribute('data-id');
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: complete }),
    });
  }
  fetchTasks();
}
window.filterTasks = function(type) {
  currentFilter = type;
  fetchTasks();
}

function updateFilter() {
  const all = document.getElementById('filter-all').checked;
  const completed = document.getElementById('filter-completed').checked;
  const incomplete = document.getElementById('filter-incomplete').checked;
  if (all) {
    currentFilter = 'all';
  } else if (completed && !incomplete) {
    currentFilter = 'completed';
  } else if (!completed && incomplete) {
    currentFilter = 'incomplete';
  } else {
    currentFilter = 'all';
  }
  fetchTasks();
}

window.addEventListener('DOMContentLoaded', () => {
  const filterDropdown = document.getElementById('filter-dropdown');
  if (filterDropdown) {
    filterDropdown.addEventListener('change', function() {
      window.filterTasks(this.value);
    });
  }
});

window.bulkDeleteSelected = async function() {
  // Find all checked checkboxes and delete corresponding tasks
  const checkedBoxes = document.querySelectorAll('.bulk-checkbox:checked');
  for (const cb of checkedBoxes) {
    const id = cb.getAttribute('data-id');
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  }
  fetchTasks();
}
window.viewTaskDetail = async function(id) {
  const detailDiv = document.getElementById('task-detail-view');
  // Toggle: if already visible for this task, hide; else show for this task
  if (detailDiv.getAttribute('data-task-id') == id && detailDiv.style.display === 'block') {
    detailDiv.style.display = 'none';
    detailDiv.innerHTML = '';
    detailDiv.removeAttribute('data-task-id');
    return;
  }
  const response = await fetch(`${API_URL}/${id}`);
  const task = await response.json();
  detailDiv.style.display = 'block';
  detailDiv.setAttribute('data-task-id', id);
  detailDiv.innerHTML = `
    <div style="display: flex; flex-direction: row; align-items: center; gap: 32px; width: 100%;">
      <div style="flex: 1;">
        <h3>Task Details</h3>
        <strong>Title:</strong> ${task.title}<br/>
        <strong>Details:</strong> ${task.details || ''}<br/>
        <strong>Status:</strong> ${task.completed ? 'Completed' : 'Incomplete'}<br/>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 12px;">
        <button onclick="closeTaskDetail()" style="min-width: 80px; padding: 8px 0; font-size: 0.98em; border-radius: 8px; box-shadow: 0 1px 4px rgba(99,102,241,0.07); background: linear-gradient(90deg, #6366f1 0%, #2563eb 100%); color: #fff; border: none; cursor: pointer; transition: background 0.2s, box-shadow 0.2s, transform 0.2s;">Close</button>
      </div>
    </div>
  `;
}
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

const API_URL = 'http://localhost:3000/api/tasks';
let currentFilter = 'all';
let selectedTasks = new Set();

// Fetch and display tasks
async function fetchTasks() {
  const response = await fetch(API_URL);
  const tasks = await response.json();
  taskList.innerHTML = '';
  let filteredTasks = tasks;
  if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(task => task.completed);
  } else if (currentFilter === 'incomplete') {
    filteredTasks = tasks.filter(task => !task.completed);
  }
  taskList.innerHTML = '';
  filteredTasks.forEach((task) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="bulk-checkbox" data-task-id="${task.id}" /></td>
      <td>
        <span style="text-decoration: ${task.completed ? 'line-through' : 'none'}; color:#2563eb; cursor:pointer;" id="task-title-${task.id}" onclick="toggleRowDetail(${task.id})">${task.title}</span>
        <span id="edit-input-${task.id}" style="display:none;"></span>
      </td>
      <td><span class="status-badge ${task.completed ? 'status-completed' : 'status-inprogress'}">${task.completed ? 'Completed' : 'In-Progress'}</span></td>
      <td style="vertical-align: top; text-align: center;">
        <div class="task-actions">
          <button class="icon-btn" title="${task.completed ? 'Undo' : 'Complete'}"  data-test-id="status" onclick="toggleTask(${task.id}, ${task.completed})">
            ${task.completed ? '<span style="color:#2563eb;">&#8634;</span>' : '<span style="color:#38ef7d;">&#10003;</span>'}
          </button>
          <button class="icon-btn delete-btn" title="Delete" aria-label="Delete" data-test-id="delete-task" onclick="deleteTask(${task.id})">
            <span style="color:#ef4444;">&#128465;</span>
          </button>
          <button class="icon-btn" title="Rename" onclick="showEditInput(${task.id}, '${task.title.replace(/'/g, "\'")}')">
            <span style="color:#2563eb;">&#9998;</span>
          </button>
        </div>
      </td>
    `;
    taskList.appendChild(tr);
    // Add expandable details row
    const detailTr = document.createElement('tr');
    detailTr.id = `detail-row-${task.id}`;
    detailTr.style.display = 'none';
    detailTr.innerHTML = `<td colspan="4" style="background:rgba(245,250,255,0.7); padding:18px 32px; border-radius:0 0 14px 14px; color:#2563eb; font-size:1.08em;">${task.details ? `<strong>Details:</strong> ${task.details}` : '<em>No details provided.</em>'}</td>`;
    taskList.appendChild(detailTr);
  });
// Toggle details row for a task
window.toggleRowDetail = function(id) {
  const detailRow = document.getElementById(`detail-row-${id}`);
  if (!detailRow) return;
  detailRow.style.display = (detailRow.style.display === 'none' || detailRow.style.display === '') ? 'table-row' : 'none';
}
  // Select-all logic for table rows
  const selectAll = document.getElementById('select-all-checkbox');
  if (selectAll) {
    selectAll.onclick = function() {
      const checkboxes = document.querySelectorAll('.bulk-checkbox');
      checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
    };
    const checkboxes = document.querySelectorAll('.bulk-checkbox');
    checkboxes.forEach(cb => {
      cb.onchange = function() {
        const allChecked = Array.from(document.querySelectorAll('.bulk-checkbox')).every(c => c.checked);
        selectAll.checked = allChecked;
      };
    });
  }

  // Show rename input for a task
}

window.closeTaskDetail = function() {
  const detailDiv = document.getElementById('task-detail-view');
  detailDiv.style.display = 'none';
  detailDiv.innerHTML = '';
  detailDiv.removeAttribute('data-task-id');
}
// Show inline input for editing a task
window.showEditInput = function(id, currentTitle) {
  const inputSpan = document.getElementById(`edit-input-${id}`);
  inputSpan.style.display = 'inline';
  inputSpan.innerHTML = `
    <input type="text" id="edit-field-${id}" value="${currentTitle}" style="margin-left:8px;" />
    <button onclick="submitEdit(${id})">Save</button>
    <button onclick="cancelEdit(${id})">Cancel</button>
  `;
}

window.submitEdit = async function(id) {
  const input = document.getElementById(`edit-field-${id}`);
  const newTitle = input.value;
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle }),
  });
  fetchTasks();
}

window.cancelEdit = function(id) {
  const inputSpan = document.getElementById(`edit-input-${id}`);
  inputSpan.style.display = 'none';
  inputSpan.innerHTML = '';
}

// Add a new task
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskInput.value;
  const details = document.getElementById('task-detail-input').value;
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, details }),
  });
  taskInput.value = '';
  document.getElementById('task-detail-input').value = '';
  fetchTasks();
});

// Toggle task completion
async function toggleTask(id, completed) {
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: !completed }),
  });
  fetchTasks();
}

// Delete a task
async function deleteTask(id) {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  fetchTasks();
}

// Initial fetch
fetchTasks();