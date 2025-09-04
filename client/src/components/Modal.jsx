import { useEffect, useRef } from 'react';

export default function Modal({ title, children, onClose, width = 520 }) {
  const panelRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    lastFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') handleTrap(e);
    }
    window.addEventListener('keydown', onKey);
    setTimeout(() => {
      panelRef.current?.querySelector('[data-autofocus]')?.focus();
    }, 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocused.current && lastFocused.current.focus?.();
    };
  }, [onClose]);

  function handleTrap(e) {
    const focusables = panelRef.current.querySelectorAll(
      'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const list = Array.from(focusables);
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  return (
    <div className="m-overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div
        className="m-panel"
        ref={panelRef}
        style={{ maxWidth: width }}
      >
        <div className="m-head">
          <h2>{title}</h2>
          <button
            className="m-close"
            aria-label="Close modal"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="m-body">
          {children}
        </div>
      </div>
    </div>
  );
}