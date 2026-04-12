import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
}) => {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 flex items-center justify-center z-[201] pointer-events-none"
          >
            <div className="w-full max-w-md mx-4 glass rounded-3xl border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden">
              <div className="p-8 flex flex-col items-center text-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  variant === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'
                }`}>
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{message}</p>
              </div>
              <div className="flex border-t border-white/5">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all border-r border-white/5"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className={`flex-1 py-4 text-sm font-bold transition-all ${
                    variant === 'danger'
                      ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
