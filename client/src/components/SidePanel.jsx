import React, { useEffect, useRef } from 'react';

export default function SidePanel({ open, title = 'Tasks', onClose, children }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    function handleKey(e){
      if(e.key === 'Escape' && open){ onClose && onClose(); }
    }
    if(open){
      previouslyFocused.current = document.activeElement;
      document.addEventListener('keydown', handleKey);
      setTimeout(()=>{ panelRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]')?.focus(); }, 30);
      document.body.classList.add('sp-lock');
    } else {
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('sp-lock');
      if(previouslyFocused.current){ try { previouslyFocused.current.focus(); } catch{} }
    }
    return () => { document.removeEventListener('keydown', handleKey); document.body.classList.remove('sp-lock'); };
  }, [open, onClose]);

  return (
    <div className={`sidepanel-root ${open ? 'open': ''}`} aria-hidden={!open}>
      <div className="sidepanel-backdrop" onClick={()=>onClose && onClose()} aria-hidden="true" />
      <aside
        className="sidepanel"
        ref={panelRef}
        role="complementary"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="sidepanel-head">
          <h2 className="sidepanel-title">{title}</h2>
          <button type="button" className="sidepanel-close" onClick={()=>onClose && onClose()} aria-label="Close panel">×</button>
        </header>
        <div className="sidepanel-body">
          {children}
        </div>
      </aside>
    </div>
  );
}
