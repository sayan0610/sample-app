import React, { useEffect, useRef, useState } from 'react';

export default function MoreMenu({ onEdit, onComplete, onDelete, completed }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e){ if (open && ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);
  return (
    <div className="moremenu" ref={ref}>
      <button className="moremenu-trigger" type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(v=>!v)}>⋮</button>
      {open && (
        <div className="moremenu-pop" role="menu">
          {!completed && <button role="menuitem" onClick={onComplete}>✅ Mark complete</button>}
          <button role="menuitem" onClick={onEdit}>✎ Edit task</button>
          <button role="menuitem" className="danger" onClick={onDelete}>🗑 Delete</button>
        </div>
      )}
    </div>
  );
}
