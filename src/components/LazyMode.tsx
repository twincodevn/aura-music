import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Pause } from 'lucide-react';
import { cn } from '../lib/utils';

interface LazyModeProps {
  onTrigger: () => void;
  isPlaying: boolean;
}

export const LazyMode: React.FC<LazyModeProps> = ({ onTrigger, isPlaying }) => {
  const [pulsing, setPulsing] = React.useState(!isPlaying);

  // Bounce to draw attention when music is not playing
  React.useEffect(() => {
    if (isPlaying) {
      setPulsing(false);
      return;
    }
    const interval = setInterval(() => {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1200);
    }, 12000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <motion.div
      className="fixed bottom-28 right-6 z-40 flex flex-col items-end gap-2 no-drag"
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0.5, delay: 0.8 }}
    >
      {/* Tooltip label */}
      <AnimatePresence>
        {pulsing && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.9 }}
            className="glass-dark border border-white/10 rounded-2xl px-3.5 py-2 shadow-2xl"
          >
            <p className="text-xs font-bold text-white whitespace-nowrap">Lười chọn?</p>
            <p className="text-[10px] text-slate-400 whitespace-nowrap">Aura chọn nhạc cho</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={onTrigger}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        animate={pulsing ? {
          scale: [1, 1.12, 1, 1.06, 1],
          transition: { duration: 0.9, ease: 'easeInOut' }
        } : {}}
        className={cn(
          "relative w-14 h-14 rounded-2xl neon-button flex items-center justify-center shadow-2xl",
          "after:absolute after:inset-0 after:rounded-2xl after:border-2 after:border-white/20"
        )}
        title="Lazy Mode — AI picks music instantly"
        aria-label="Lazy Mode"
      >
        {/* Pulse rings when pulsing */}
        {pulsing && (
          <>
            <span className="absolute inset-0 rounded-2xl opacity-60 animate-ping" style={{ background: 'rgba(var(--ambient-primary),0.3)' }} />
            <span className="absolute inset-0 rounded-2xl opacity-30 animate-ping" style={{ background: 'rgba(var(--ambient-primary),0.2)', animationDelay: '0.3s' }} />
          </>
        )}

        {isPlaying ? (
          <div className="flex flex-col items-center gap-1">
            <Pause size={18} className="text-white" fill="currentColor" />
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'rgba(255,255,255,0.7)' }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <Brain size={18} className="text-white" />
            <Zap size={10} className="text-white/70" />
          </div>
        )}
      </motion.button>
    </motion.div>
  );
};
