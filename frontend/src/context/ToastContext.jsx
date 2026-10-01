import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'success') => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), 6000);
    },
    [remove]
  );

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed right-5 top-5 z-[200] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`flex items-start gap-3 rounded-xl border bg-ink-900 px-4 py-3 shadow-2xl backdrop-blur-md ${
                t.type === 'success'
                  ? 'bg-ink-850/90 border-mint-500/30 text-paper'
                  : 'bg-ink-850/90 border-coral-500/30 text-paper'
              }`}
            >
              {t.type === 'success' ? (
                <CheckCircle2 size={18} className="text-mint-400 mt-0.5 shrink-0" />
              ) : (
                <XCircle size={18} className="text-coral-400 mt-0.5 shrink-0" />
              )}
              <p className="text-sm leading-snug flex-1">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="text-white/40 hover:text-white/80 transition-colors"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider');
  return ctx;
}
