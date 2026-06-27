import React, { useEffect } from 'react';
import type { Toast } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastMessageProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({ toast, onClose }) => {
  const { id, type, message, duration = 4000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-200 dark:border-rose-800/50',
      text: 'text-rose-800 dark:text-rose-300',
      icon: <XCircle className="w-5 h-5 text-rose-500" />,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-800 dark:text-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/50',
      text: 'text-blue-800 dark:text-blue-300',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${config.bg} ${config.border} ${config.text} animate-fade-in pointer-events-auto min-w-[300px] max-w-md`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-grow text-sm font-medium pr-2 leading-relaxed">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-lg p-0.5 hover:bg-black/5 dark:hover:bg-white/5"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none max-w-full">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
