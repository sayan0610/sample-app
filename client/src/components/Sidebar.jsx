import React, { useState } from 'react';

export default function Sidebar({ active, onChange, user, onEditProfile, onLogout, onChangePassword }) {
  const [prefOpen, setPrefOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <nav className={`app-sidebar ${collapsed ? 'collapsed':''}`} aria-label="Primary">
      <div className="sb-top">
        <div className="sb-brand">TaskManager</div>
        <button
          type="button"
          className="sb-collapse-btn"
          aria-label={collapsed ? 'Expand sidebar':'Collapse sidebar'}
          aria-expanded={!collapsed}
          onClick={()=>setCollapsed(c=>!c)}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <div className="sb-search">
        <input type="text" placeholder="Search" aria-label="Search navigation" />
      </div>
      <div className="sb-tabs" role="tablist" aria-label="Scope">
        <button type="button" role="tab" aria-selected={true} className="active">My account</button>
        <button type="button" role="tab" aria-selected={false}>Shared</button>
      </div>
      <ul className="sb-section" role="list">
        <SidebarItem icon="🏠" label="Overview" id="overview" active={active==='overview'} onChange={onChange} />
        <SidebarItem icon="📋" label="All tasks" id="tasks" active={active==='tasks'} onChange={onChange} />
        <SidebarItem icon="⏰" label="Scheduled" id="scheduled" active={active==='scheduled'} onChange={onChange} />
      </ul>
      <div className="sb-spacer" />
      <div className="sb-user" aria-label="Account">
        <div className="sb-user-main">
            <div className="avatar" aria-hidden>{(user?.username||'U').charAt(0).toUpperCase()}</div>
            {!collapsed && (
              <div className="meta">
                <div className="uname">{user?.username || 'User'}</div>
                <div className="ulight">{user?.provider || 'local'}</div>
              </div>
            )}
        </div>
        {!collapsed && (
          <div className="sb-user-actions">
            <button type="button" onClick={onEditProfile}>Edit</button>
            {user?.provider !== 'google' && <button type="button" onClick={onChangePassword}>Password</button>}
            <button type="button" onClick={onLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

function SidebarItem({ icon, label, id, active, onChange, small }) {
  return (
    <li>
      <button
        type="button"
        className={`sb-item ${active ? 'active': ''} ${small ? 'small':''}`}
        onClick={()=>onChange && onChange(id)}
        aria-current={active ? 'page': undefined}
      >
        {icon && <span className="icon" aria-hidden>{icon}</span>}
        <span className="label">{label}</span>
      </button>
    </li>
  );
}