import React, { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks.js';
import { useAuth } from './auth/AuthContext.jsx';
import AddTaskModal from './components/AddTaskModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import TaskTable from './components/TaskTable.jsx';
import TaskEditModal from './components/TaskEditModal.jsx';
import CompleteTaskModal from './components/CompleteTaskModal.jsx';
import SidePanel from './components/SidePanel.jsx';
import Sidebar from './components/Sidebar.jsx';

function UserAvatar({ username }) {
  try {
    if (username) {
      const users = JSON.parse(localStorage.getItem('auth_users')||'[]');
      const found = users.find(u => u.username?.toLowerCase() === username.toLowerCase());
      const photo = found?.photo;
      if (photo) {
        return (
          <span style={{width:30,height:30,borderRadius:'50%',overflow:'hidden',display:'inline-flex',alignItems:'center',justifyContent:'center',background:'#e2e8f0',border:'1px solid #cbd5e1'}}>
            <img src={photo} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={(e)=>{e.currentTarget.style.display='none';}} />
          </span>
        );
      }
    }
  } catch {}
  const letter = (username||'U').charAt(0).toUpperCase();
  return <span style={{width:30,height:30,borderRadius:'50%',background:'#475569',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:600,border:'1px solid #334155'}}>{letter}</span>;
}

export default function App() {
  const { user, logout, login } = useAuth();
  const { tasks, filter, setFilter, loading, error, addTask, updateTask, deleteTask, bulkStatus, bulkDelete } = useTasks();

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('tasks');

  useEffect(()=>{ console.debug('[App] tasks prop', tasks); }, [tasks]);

  function handleSelectOne(id, checked) { setSelectedIds(p => { const n = new Set(p); checked ? n.add(id) : n.delete(id); return n; }); }
  function handleSelectAll(checked) { setSelectedIds(checked ? new Set(tasks.map(t => t.id)) : new Set()); }
  async function toggleTask(task) { await updateTask(task.id, { completed: !task.completed }); }
  function handleRequestComplete(task) { setCompletingTask(task); }
  async function handleConfirmComplete({ reason, signature }) { await updateTask(completingTask.id, { completed: true, completionReason: reason, completionSignature: signature }); setCompletingTask(null); }

  async function handleChangePassword() {
    if (!user || user.provider === 'google') return;
    const current = prompt('Enter current password');
    if (!current) return;
    try {
      await logout();
      const uname = user.username;
      await login({ username: uname, password: current });
    } catch { alert('Current password incorrect'); return; }
    const next = prompt('Enter new password'); if (!next) return;
    const confirm = prompt('Confirm new password'); if (next !== confirm) { alert('Passwords do not match'); return; }
    try {
      const users = JSON.parse(localStorage.getItem('auth_users')||'[]');
      const idx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
      if (idx !== -1) {
        const enc = new TextEncoder();
        const buf = await crypto.subtle.digest('SHA-256', enc.encode(next));
        const hash = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
        users[idx].passwordHash = hash; localStorage.setItem('auth_users', JSON.stringify(users)); alert('Password changed');
      }
    } catch (e) { console.error('Change password failed', e); alert('Failed to change password'); }
  }

  // Helpers passed to TaskTable (kept existing names expected elsewhere)
  const renameTask = (task, title) => updateTask(task.id, { title });
  const handleEdit = (task) => setEditingTask(task);
  const closeEdit = () => setEditingTask(null);
  const saveModal = (id, patch) => updateTask(id, patch);
  const bulkComplete = () => bulkStatus(Array.from(selectedIds), true);
  const bulkDeleteAction = () => { bulkDelete(Array.from(selectedIds)); setSelectedIds(new Set()); };

  return (
    <div className="app-shell with-sidebar">
      <Sidebar
        active={activeSection}
        user={user}
        onChange={(id)=> setActiveSection(id)}
        onEditProfile={()=>setShowProfile(true)}
        onLogout={logout}
        onChangePassword={handleChangePassword}
      />
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-top">
            <h1 className="brand-title">
              <span className="brand-accent">Task</span>
              <span className="brand-light">Manager</span>
            </h1>
            {activeSection === 'tasks' && (
              <button type="button" className="add-task-trigger fancy-add-btn" onClick={()=> setShowAddModal(true)} style={{marginLeft:'auto'}}>
                <span className="btn-icon" aria-hidden="true">＋</span>
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">
        {activeSection === 'tasks' && (
          <>
            <div aria-live="polite" className="sr-live" style={{marginBottom:8}}>
              {loading && <div className="info-banner">Loading tasks…</div>}
              {error && <div className="error-banner">{error}</div>}
            </div>
            <TaskTable
              tasks={tasks}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={(id, checked)=>handleSelectOne(id, checked)}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onRenameTask={renameTask}
              onEdit={handleEdit}
              onRequestComplete={handleRequestComplete}
              onBulkComplete={bulkComplete}
              onBulkDelete={bulkDeleteAction}
              onFilterChange={v => { setFilter(v); setSelectedIds(new Set()); }}
              filterValue={filter}
            />
            <div style={{marginTop:16}}>
              <button type="button" className="ba-btn" onClick={()=>setPanelOpen(true)}>Open Task Panel</button>
            </div>
          </>
        )}
        {activeSection !== 'tasks' && (
          <div style={{padding:'50px 10px', color:'var(--c-text-dim)'}}>
            <p style={{fontSize:18, fontWeight:600, margin:'0 0 10px'}}>Section: {activeSection}</p>
            <p style={{margin:0}}>This section has no content yet. Choose another item.</p>
          </div>
        )}
      </main>
      {editingTask && (
        <TaskEditModal task={editingTask} onClose={closeEdit} onSave={saveModal} />
      )}
      {completingTask && (
        <CompleteTaskModal task={completingTask} onCancel={() => setCompletingTask(null)} onConfirm={handleConfirmComplete} />
      )}
      {showAddModal && (
        <AddTaskModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={addTask} />
      )}
      {showProfile && (
        <ProfileModal open={showProfile} onClose={()=>setShowProfile(false)} />
      )}
      <SidePanel open={panelOpen} onClose={()=>setPanelOpen(false)} title="Task Details Table">
        <p style={{margin:0, fontSize:13, lineHeight:1.5}}>Standalone task table view. You can scroll independently here.</p>
        <div className="table-wrapper" data-theme="mint">
          <table id="task-table-side" className="task-table">
            <thead>
              <tr><th>Title</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.completed ? 'Done' : 'In-Progress'}</td>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={3} style={{padding:12, textAlign:'center', color:'var(--c-text-dim)'}}>No tasks.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SidePanel>
    </div>
  );
}