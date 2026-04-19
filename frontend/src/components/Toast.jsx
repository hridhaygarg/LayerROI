import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timeoutsRef.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    timeoutsRef.current[id] = setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  const colours = {
    success: { border: '#16a34a', icon: '✓', bg: '#f0fdf4' },
    error:   { border: '#dc2626', icon: '✕', bg: '#fef2f2' },
    warning: { border: '#d97706', icon: '⚠', bg: '#fffbeb' },
    info:    { border: '#2563eb', icon: 'i', bg: '#eff6ff' },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
      }}>
        {toasts.map(t => {
          const c = colours[t.type];
          return (
            <div key={t.id} style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderLeft: `4px solid ${c.border}`,
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              animation: 'toastSlideIn 300ms cubic-bezier(0.34,1.56,0.64,1) both',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#111827',
            }}>
              <span style={{
                width: '20px', height: '20px',
                background: c.border, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '11px', fontWeight: '700', flexShrink: 0
              }}>{c.icon}</span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button onClick={() => removeToast(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', fontSize: '16px', padding: '2px', flexShrink: 0,
                transition: 'color 150ms ease',
              }}>×</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
