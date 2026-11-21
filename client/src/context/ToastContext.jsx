import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {}
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />;
      case 'error':
        return <AlertCircle size={18} className="text-rose-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />;
      case 'info':
      default:
        return <Info size={18} className="text-[#6C47FF] dark:text-[#A78BFA] flex-shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100';
      case 'error':
        return 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100';
      case 'warning':
        return 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100';
      case 'info':
      default:
        return 'border-purple-500/30 bg-purple-50/90 dark:bg-[#1A172B]/95 text-slate-900 dark:text-white';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toasts Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-slide-down ${getBorderColor(
              toast.type
            )}`}
          >
            <div className="flex items-center gap-2.5">
              {getIcon(toast.type)}
              <span className="text-xs font-semibold leading-snug">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
