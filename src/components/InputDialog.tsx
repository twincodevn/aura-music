import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  defaultValue?: string;
  placeholder?: string;
}

export const InputDialog: React.FC<InputDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  defaultValue = '', 
  placeholder = '' 
}) => {
  const { t } = useLanguage();
  const [value, setValue] = useState(defaultValue);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm glass-dark p-6 rounded-3xl border border-white/10 shadow-2xl relative"
          >
            <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
            <input
              autoFocus
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors mb-6"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && value.trim()) {
                  onSubmit(value.trim());
                  onClose();
                }
                if (e.key === 'Escape') onClose();
              }}
            />
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button 
                onClick={() => {
                  if (value.trim()) {
                    onSubmit(value.trim());
                    onClose();
                  }
                }} 
                disabled={!value.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {t.common.confirm}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
