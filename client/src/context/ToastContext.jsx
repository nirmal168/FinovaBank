import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Floating Toast Notification Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="assertive"
      >
        {toasts.map((t) => {
          let bg = 'bg-slate-900/95 border-slate-800 text-white';
          let icon = <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />;

          if (t.type === 'success') {
            bg = 'bg-slate-900/95 border-emerald-500/40 text-white';
            icon = <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />;
          } else if (t.type === 'error') {
            bg = 'bg-slate-900/95 border-rose-500/40 text-white';
            icon = <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />;
          } else if (t.type === 'warning') {
            bg = 'bg-slate-900/95 border-amber-500/40 text-white';
            icon = <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${bg}`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                {icon}
                <div className="text-xs sm:text-sm font-medium leading-snug">
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg shrink-0"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
