import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, MessageSquare, Mic, Terminal, Zap } from 'lucide-react';

interface AuraChatProps {
  show: boolean;
  onClose: () => void;
  onCommand: (query: string) => void;
}

const SUGGESTIONS = [
  { label: 'Morning Coffee', icon: <Sparkles size={14} />, query: 'morning acoustic chill café vpop' },
  { label: 'Deep Focus', icon: <Terminal size={14} />, query: 'lofi study focus hip hop 2024' },
  { label: 'High Energy', icon: <Zap size={14} />, query: 'vpop remix 2025 hot dance' },
  { label: 'Rainy Night', icon: <MessageSquare size={14} />, query: 'nhạc buồn mưa lo-fi tâm trạng' },
];

export const AuraChat: React.FC<AuraChatProps> = ({ show, onClose, onCommand }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setInput('');
    }
  }, [show]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onCommand(input);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl"
          />

          {/* Chat Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[201] px-4"
          >
            <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-2">
              <div className="flex items-center gap-4 px-4 py-3">
                <Search size={20} className="text-primary animate-pulse" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell Aura what to play..."
                  className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder:text-white/20 font-medium"
                />
                <div className="flex items-center gap-2">
                   <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-tighter">Enter</div>
                   <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white">
                      <Mic size={18} />
                   </button>
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-2 border-t border-white/5 bg-black/20">
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { onCommand(s.query); onClose(); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <span className="text-primary/60 group-hover:text-primary transition-colors">{s.icon}</span>
                      <span className="text-[11px] font-bold text-white/50 group-hover:text-white transition-colors">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meta info */}
              <div className="px-4 py-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                 <span>Aura Intelligence Engine v5.0</span>
                 <div className="flex items-center gap-2">
                    <span>Press Esc to close</span>
                 </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
