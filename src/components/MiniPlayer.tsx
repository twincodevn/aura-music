import React from 'react';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuraVisualizer } from './AuraVisualizer';
import type { Track } from '../lib/constants';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  accentColor?: string;
  isAlwaysOnTop?: boolean;
  onToggleTop?: () => void;
  analyserRef?: React.RefObject<AnalyserNode | null>;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  progress,
  onTogglePlay,
  onNext,
  onPrev,
  onClose,
  accentColor = '255, 255, 255',
  isAlwaysOnTop = true,
  onToggleTop,
  analyserRef
}) => {
  if (!currentTrack) {
    return (
      <div className="h-screen w-screen glass text-white flex items-center justify-center p-4 select-none drag-region border-t border-white/5">
        <div className="text-gray-400 text-xs font-bold tracking-widest uppercase">Aura Music</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen text-white flex flex-col p-3 select-none overflow-hidden group">
      {/* Holographic Glow */}
      <div 
        className="absolute inset-0 opacity-20 blur-[100px] pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: `rgb(${accentColor})` }}
      />
      {analyserRef && (
        <AuraVisualizer 
          analyserRef={analyserRef} 
          color={accentColor} 
          className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none mix-blend-screen"
          height={64}
          count={60}
        />
      )}
      <div className="absolute inset-0 bg-black/60 glass-panel opacity-90 pointer-events-none border-t border-white/5" />

      {/* Drag handle and close */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
        <button 
          onClick={onToggleTop}
          title={isAlwaysOnTop ? "Disable Stay on Top" : "Enable Stay on Top"}
          className={`p-1.5 rounded-lg transition-all ${isAlwaysOnTop ? 'text-primary bg-primary/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
        >
          <motion.div animate={{ rotate: isAlwaysOnTop ? 45 : 0 }}>
             <SkipBack size={12} className="rotate-90" />
          </motion.div>
        </button>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex gap-3 items-center flex-1 drag-region relative z-10">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-2xl shrink-0 pointer-events-none border border-white/10">
          <img 
            src={currentTrack.thumbnail} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate text-white drop-shadow-md">{currentTrack.title}</h3>
          <p className="text-xs text-white/60 truncate drop-shadow-md mt-0.5">{currentTrack.channel}</p>
          
          <div className="flex items-center gap-4 mt-2">
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onPrev(); }}
              className="text-white/60 hover:text-white transition-colors"
            >
              <SkipBack size={18} fill="currentColor" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onTogglePlay(); }}
              className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full shadow-lg"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNext(); }}
              className="text-white/60 hover:text-white transition-colors"
            >
              <SkipForward size={18} fill="currentColor" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mt-3 h-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-md border border-white/5">
        <motion.div 
          initial={false}
          animate={{ width: `${progress}%` }}
          className="h-full relative overflow-hidden"
          style={{ backgroundColor: `rgb(${accentColor})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </motion.div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .drag-region {
          -webkit-app-region: drag;
        }
        button, a {
          -webkit-app-region: no-drag;
        }
      `}} />
    </div>
  );
};
