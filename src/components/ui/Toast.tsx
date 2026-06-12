import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const success = (msg: string) => addToast(msg, 'success');
  const error = (msg: string) => addToast(msg, 'error');

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-10 duration-300",
              t.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
              t.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-500",
              t.type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-500",
              t.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-500"
            )}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {t.type === 'info' && <Info className="w-5 h-5" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            
            <span className="text-sm font-medium">{t.message}</span>
            
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
