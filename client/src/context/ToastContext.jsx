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

  const showToast = useCallback((message, type = 'info', duration = 2500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    // Enforce strictly 1 active toast at a time: replaces previous toast, preventing stacking
    setToasts([{ id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />;
      case 'error':
        return <AlertCircle size={15} className="text-rose-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />;
      case 'info':
      default:
        return <Info size={15} className="text-[#6C47FF] dark:text-[#A78BFA] flex-shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100 shadow-emerald-900/20';
      case 'error':
        return 'border-rose-500/30 bg-rose-950/90 text-rose-100 shadow-rose-900/20';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/90 text-amber-100 shadow-amber-900/20';
      case 'info':
      default:
        return 'border-purple-500/30 bg-[#16132A]/95 text-white shadow-purple-950/30';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Sleek Floating Pill Toast: Centered, Compact, Zero Stacking */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none px-3 w-auto max-w-[92vw]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-xl transition-all animate-slide-down ${getBorderColor(
              toast.type
            )}`}
          >
            {getIcon(toast.type)}
            <span className="text-xs font-semibold whitespace-nowrap truncate max-w-[70vw]">
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X size={13} />
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
