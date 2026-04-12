import React from 'react';
import { EQ_PRESETS, EQ_FREQS } from '../lib/constants';
import { cn } from '../lib/utils';
import { X, RotateCcw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

interface EqPanelProps {
  show: boolean;
  onClose: () => void;
  eqPreset: string;
  setEqPreset: (p: string) => void;
  eqBands: number[];
  setEqBands: (b: number[]) => void;
}

export const EqPanel: React.FC<EqPanelProps> = ({
  show,
  onClose,
  eqPreset,
  setEqPreset,
  eqBands,
  setEqBands,
}) => {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed right-6 bottom-28 w-80 glass p-6 rounded-3xl z-40 shadow-2xl border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary-light">{t.player.equalizer}</h3>
            <div className="flex items-center gap-1">
               <button onClick={() => { setEqBands(EQ_PRESETS.flat); setEqPreset('flat'); }} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                 <RotateCcw size={14} />
               </button>
               <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                 <X size={16} />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-8">
            {Object.keys(EQ_PRESETS).map(p => (
              <button
                key={p}
                onClick={() => { setEqPreset(p); setEqBands(EQ_PRESETS[p]); }}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  eqPreset === p ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-slate-500 hover:bg-white/10"
                )}
              >
                {t.eq[p as keyof typeof t.eq] || p}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-end h-40 gap-1.5">
            {eqBands.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="relative w-1.5 h-full bg-slate-800/50 rounded-full overflow-hidden mb-2">
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-primary-light rounded-full transition-all duration-300" 
                    style={{ height: `${((val + 12) / 24) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={val}
                    onChange={(e) => {
                      const newBands = [...eqBands];
                      newBands[i] = Number(e.target.value);
                      setEqBands(newBands);
                      setEqPreset('custom');
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer orientation-vertical"
                    style={{ writingMode: 'bt-lr' as any }}
                  />
                </div>
                <span className="text-[8px] font-bold text-slate-600 group-hover:text-slate-400 transition-colors">{EQ_FREQS[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
