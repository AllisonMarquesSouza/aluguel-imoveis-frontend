import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { focusDialogStart, trapDialogTab } from './modal-focus.js';

export function Modal({ title, onClose, restoreFocusRef, children }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusDialogStart(dialog);

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      } else {
        trapDialogTab(event, dialog, document.activeElement);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const returnTarget = restoreFocusRef?.current || previousFocus;
      if (returnTarget?.isConnected && typeof returnTarget.focus === 'function') returnTarget.focus();
    };
  }, [restoreFocusRef]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex="-1">
        <header>
          <h2 id={titleId}>{title}</h2>
          <button className="icon" onClick={onClose} aria-label="Fechar">×</button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function useToast() {
  const [t, setT] = useState(null);
  const show = useCallback((text, kind = 'ok') => {
    setT({ text, kind });
    setTimeout(() => setT(null), 4500);
  }, []);
  const node = t && <div className={`toast ${t.kind}`} role="status">{t.text}</div>;
  return [node, show];
}

export const initials = (n = '') =>
  n.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
