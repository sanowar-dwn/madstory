import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  details?: string | Record<string, any>;
  duration?: number; // ms, default 5000 (0 for persistent)
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
  success: (message: string, options?: Partial<ToastOptions>) => string;
  error: (message: string, options?: Partial<ToastOptions>) => string;
  warning: (message: string, options?: Partial<ToastOptions>) => string;
  info: (message: string, options?: Partial<ToastOptions>) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Standalone event emitter for non-React code (e.g., Axios interceptors)
type ToastListener = (toast: ToastOptions) => void;
const toastListeners: Set<ToastListener> = new Set();

export const emitGlobalToast = (options: ToastOptions) => {
  toastListeners.forEach((listener) => listener(options));
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const type = options.type || 'info';
      const duration = options.duration !== undefined ? options.duration : type === 'error' ? 6500 : 4500;

      setToasts((prev) => {
        // Prevent duplicate toasts within 1.5 seconds with exact same message
        const duplicate = prev.find(
          (t) => t.message === options.message && Date.now() - t.createdAt < 1500
        );
        if (duplicate) return prev;

        const newToast: ToastItem = {
          ...options,
          id,
          type,
          duration,
          createdAt: Date.now(),
        };

        // Keep maximum 5 concurrent toasts to avoid cluttering
        const updated = [newToast, ...prev].slice(0, 5);
        return updated;
      });

      return id;
    },
    []
  );

  // Subscribe to standalone emitter
  useEffect(() => {
    const handleGlobal = (options: ToastOptions) => {
      showToast(options);
    };
    toastListeners.add(handleGlobal);
    return () => {
      toastListeners.delete(handleGlobal);
    };
  }, [showToast]);

  const success = useCallback(
    (message: string, options?: Partial<ToastOptions>) =>
      showToast({ ...options, message, type: 'success' }),
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: Partial<ToastOptions>) =>
      showToast({ ...options, message, type: 'error' }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: Partial<ToastOptions>) =>
      showToast({ ...options, message, type: 'warning' }),
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: Partial<ToastOptions>) =>
      showToast({ ...options, message, type: 'info' }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        clearAll,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
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

// Global shorthand for usage in services or modules without hook
export const toast = {
  success: (message: string, options?: Partial<ToastOptions>) =>
    emitGlobalToast({ ...options, message, type: 'success' }),
  error: (message: string, options?: Partial<ToastOptions>) =>
    emitGlobalToast({ ...options, message, type: 'error' }),
  warning: (message: string, options?: Partial<ToastOptions>) =>
    emitGlobalToast({ ...options, message, type: 'warning' }),
  info: (message: string, options?: Partial<ToastOptions>) =>
    emitGlobalToast({ ...options, message, type: 'info' }),
};

// ----------------------------------------------------------------------
// Toast UI Container Component
// ----------------------------------------------------------------------
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Individual Toast Card
const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  const styleConfig = {
    error: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-rose-600 border-rose-200/80',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
      titleColor: 'text-rose-950',
      defaultTitle: 'ত্রুটি (Error)',
      barColor: 'bg-rose-500',
    },
    success: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-emerald-600 border-emerald-200/80',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
      titleColor: 'text-emerald-950',
      defaultTitle: 'সফল (Success)',
      barColor: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-amber-500 border-amber-200/80',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
      titleColor: 'text-amber-950',
      defaultTitle: 'সতর্কতা (Warning)',
      barColor: 'bg-amber-500',
    },
    info: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-sky-600 border-sky-200/80',
      icon: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
      titleColor: 'text-sky-950',
      defaultTitle: 'তথ্য (Notice)',
      barColor: 'bg-sky-500',
    },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={`pointer-events-auto relative overflow-hidden rounded-md shadow-xl border bg-white ${styleConfig.border} font-bengali text-gray-800 text-xs transition-shadow hover:shadow-2xl`}
    >
      <div className="p-3.5 flex items-start gap-3">
        {styleConfig.icon}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`font-bold text-[13px] leading-tight ${styleConfig.titleColor}`}>
              {toast.title || styleConfig.defaultTitle}
            </h4>
            <span className="text-[10px] text-gray-400 font-sans">
              {new Date(toast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <p className="mt-1 text-gray-700 font-normal leading-relaxed text-[12px] break-words whitespace-pre-line">
            {toast.message}
          </p>

          {/* Action button if defined */}
          {toast.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/5 hover:bg-black/10 active:bg-black/15 text-gray-800 rounded font-semibold text-[11px] transition"
              >
                <RefreshCw className="w-3 h-3" />
                {toast.action.label}
              </button>
            </div>
          )}

          {/* Expandable Technical Details */}
          {toast.details && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 transition"
              >
                <span>{showDetails ? 'বিস্তারিত লুকান' : 'কারিগরি বিবরণ (Details)'}</span>
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showDetails && (
                <div className="mt-1.5 p-2 bg-gray-50 rounded border border-gray-200 text-[10px] font-mono text-gray-700 max-h-36 overflow-auto whitespace-pre-wrap select-all">
                  {typeof toast.details === 'string'
                    ? toast.details
                    : JSON.stringify(toast.details, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition flex-shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-dismiss progress countdown */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={`h-0.5 absolute bottom-0 left-0 right-0 ${styleConfig.barColor} opacity-75`}
        />
      )}
    </motion.div>
  );
};
