import { useCallback, useEffect, useState } from 'react';

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
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
