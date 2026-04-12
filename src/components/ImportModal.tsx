import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DownloadCloud } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (code: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [code, setCode] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onImport(code.trim());
      setCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#1a1b26] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 text-emerald-400">
                <DownloadCloud size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Import Playlist</h2>
              <p className="text-sm text-slate-400">Paste a shared playlist code to mix into your current playlist.</p>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste code here..."
              className="w-full h-32 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none font-mono text-sm mb-6"
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={!code.trim()}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Tracks
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
