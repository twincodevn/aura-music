import React from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Heart, Share2,
  ListMusic, SlidersHorizontal, Volume2, VolumeX, Maximize2, Mic2, Timer, Music2,
  Camera, Image as ImageIcon, RotateCcw, Sparkles, Shuffle, Repeat, Repeat1
} from 'lucide-react';
import type { Track } from '../lib/constants';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { AuraVisualizer } from './AuraVisualizer';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  streamLoading: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  volume: number;
  isLiked: boolean;
  showQueue: boolean;
  showEq: boolean;
  showLyrics: boolean;
  userAvatar: string | null;
  playerBarBg: string | null;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (val: number | React.MouseEvent<HTMLDivElement>) => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleLike: () => void;
  onShare: () => void;
  onToggleQueue: () => void;
  onToggleEq: () => void;
  onToggleLyrics: () => void;
  onMiniPlayer: () => void;
  onToggleMute: () => void;
  onAvatarUpload: (file: File) => void;
  onBgUpload: (file: File) => void;
  onResetPersonalization: () => void;
  canNext: boolean;
  canPrev: boolean;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  sleepTimer: {
    isActive: boolean;
    remainingTime: string | null;
    startTimer: (mins: number) => void;
    cancelTimer: () => void;
  };
  analyserRef?: React.RefObject<AnalyserNode | null>;
  accentColor?: string;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  streamLoading,
  progress,
  currentTime,
  duration,
  volume,
  isLiked,
  showQueue,
  showEq,
  showLyrics,
  userAvatar,
  playerBarBg,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleLike,
  onShare,
  onToggleQueue,
  onToggleEq,
  onToggleLyrics,
  onMiniPlayer,
  onAvatarUpload,
  onBgUpload,
  onResetPersonalization,
  canNext,
  canPrev,
  shuffle,
  repeat,
  onToggleShuffle,
  onToggleRepeat,
  onToggleMute,
  sleepTimer,
  analyserRef,
  accentColor = '255, 255, 255',
}) => {
  const { t } = useLanguage();
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubProgress, setScrubProgress] = React.useState(0);
  const [showTimerMenu, setShowTimerMenu] = React.useState(false);
  const [showPersonalize, setShowPersonalize] = React.useState(false);
  const progressBarRef = React.useRef<HTMLDivElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  const handleScrub = React.useCallback((e: MouseEvent) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setScrubProgress(percent);
  }, []);

  React.useEffect(() => {
    if (!isScrubbing) return;

    const onMouseMove = (e: MouseEvent) => handleScrub(e);
    const onMouseUp = () => {
      setIsScrubbing(false);
      onSeek(scrubProgress);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isScrubbing, scrubProgress, handleScrub, onSeek]);

  const displayProgress = isScrubbing ? scrubProgress : progress;

  return (
    <div className="px-4 pb-4 w-full">
      <footer className="w-full relative z-[60] h-[80px] lg:h-[95px] backdrop-blur-[60px] saturate-[200%] bg-black/40 border border-white/10 rounded-3xl flex flex-col no-drag shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_rgba(255,255,255,0.1)] shrink-0 transition-all duration-500 overflow-hidden px-8">
        {/* ── Personalization Background Layer */}
        <AnimatePresence>
          {playerBarBg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -z-10"
            >
              <img src={playerBarBg} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 backdrop-blur-3xl bg-black/40" />
            </motion.div>
          )}
        </AnimatePresence>

      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onAvatarUpload(e.target.files[0])} />
      <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onBgUpload(e.target.files[0])} />

      {/* ── Progress Bar: Cinematic Top Edge — with large invisible hit area */}
      <div 
        ref={progressBarRef}
        className="absolute top-0 left-0 right-0 group cursor-pointer z-20"
        style={{ height: '20px', paddingTop: '0px' }}
        onMouseDown={(e) => {
          setIsScrubbing(true);
          const rect = progressBarRef.current!.getBoundingClientRect();
          const percent = ((e.clientX - rect.left) / rect.width) * 100;
          setScrubProgress(percent);
        }}
      >
        {/* Visual bar — thin but grows on hover */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden transition-all duration-300" style={{ height: isScrubbing ? '4px' : '2px' }}>
          <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
          <motion.div
            className="absolute h-full left-0 top-0 transition-colors"
            style={{ 
               width: `${displayProgress}%`, 
               backgroundColor: `rgb(${accentColor})`,
               boxShadow: `0 0 20px rgba(${accentColor}, 0.6)` 
            }}
          />
          {/* Leading Spark */}
          <motion.div 
             className="absolute top-0 w-1 h-full bg-white animate-pulse-glow z-30"
             style={{ left: `${displayProgress}%`, marginLeft: '-1px' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr_1.2fr] items-center h-full gap-4 pt-1">
        
        {/* ── Artwork & Track Info (Left) */}
        <div className="flex items-center gap-4 min-w-0 group/info">
          <motion.div 
            animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-11 h-11 lg:w-13 lg:h-13 rounded-lg overflow-hidden bg-zinc-900 shadow-xl border border-white/5 shrink-0 transition-all duration-500 group-hover/info:scale-105 group-hover/info:shadow-[0_0_25px_rgba(var(--ambient-primary),0.3)]"
          >
            {currentTrack?.thumbnail ? (
              <img src={currentTrack.thumbnail} className={cn("w-full h-full object-cover transition-all duration-700", streamLoading && "opacity-40 blur-sm scale-110")} alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                 <Music2 size={24} className="text-zinc-800" />
              </div>
            )}
            
            {/* Embedded Visualizer in artwork glow area */}
             {analyserRef && isPlaying && (
               <AuraVisualizer 
                 analyserRef={analyserRef} 
                 color={accentColor} 
                 className="absolute inset-0 opacity-40 pointer-events-none mix-blend-screen"
                 height={52}
                 count={40}
               />
             )}
          </motion.div>
          
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="marquee-container mb-0.5">
              <div className={cn("marquee-track", (!currentTrack || currentTrack.title.length < 25) && "animate-none")}>
                <h4 className="inline-block text-[14px] font-bold text-white leading-tight tracking-tight group-hover/info:text-primary transition-colors pr-12">
                  {currentTrack?.title || t.player.selectTrack}
                </h4>
                {currentTrack && currentTrack.title.length >= 25 && (
                  <h4 className="inline-block text-[14px] font-bold text-white leading-tight tracking-tight group-hover/info:text-primary transition-colors pr-12">
                    {currentTrack.title}
                  </h4>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-40 truncate">{currentTrack?.channel || 'Aura Music'}</span>
              <span className="text-[9px] font-black text-primary/60 tabular-nums">{currentTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover/info:opacity-100 transition-all duration-500 translate-x-2 group-hover/info:translate-x-0 shrink-0">
            {currentTrack && (
               <>
                 <button onClick={onToggleLike} className={cn("p-2 rounded-lg hover:bg-white/5 transition-all duration-300", isLiked ? "text-pink-500" : "text-slate-500 hover:text-white")}>
                    <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                 </button>
                 <button onClick={onShare} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all duration-300">
                    <Share2 size={16} />
                 </button>
               </>
            )}
          </div>
        </div>

        {/* ── Playback Controls (Center) */}
        <div className="flex items-center justify-center gap-4 lg:gap-6">
          <button
            onClick={onToggleShuffle}
            title="Shuffle"
            className={cn(
              "p-2 rounded-xl transition-all duration-300 active:scale-90",
              shuffle ? "text-primary" : "text-slate-600 hover:text-white"
            )}
          >
            <Shuffle size={16} />
          </button>

          <button onClick={onPrev} disabled={!canPrev} className={cn("transition-all duration-300", canPrev ? "text-slate-400 hover:text-white hover:scale-110" : "text-zinc-800 cursor-not-allowed")}>
            <SkipBack size={20} fill="currentColor" />
          </button>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(var(--ambient-primary),0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (currentTrack && !streamLoading) onPlayPause(); }}
            className={cn(
              "relative w-12 h-12 lg:w-15 lg:h-15 rounded-full bg-white text-black flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-all outline-none group/play overflow-hidden shrink-0",
              !currentTrack ? "opacity-30 cursor-default" : "opacity-100 cursor-pointer"
            )}
          >
            {/* Custom User Avatar Layer */}
            <AnimatePresence>
              {userAvatar && (
                <motion.div 
                  initial={{ opacity: 0, rotate: 0 }} 
                  animate={{ 
                    opacity: 1, 
                    rotate: isPlaying ? 360 : 0 
                  }} 
                  transition={{
                    rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                    opacity: { duration: 0.4 }
                  }}
                  exit={{ opacity: 0 }} 
                  className="absolute inset-0 z-0"
                >
                  <img src={userAvatar} className="w-full h-full object-cover" alt="User Avatar" />
                  <div className={cn("absolute inset-0 bg-black/30", isPlaying ? "opacity-40" : "opacity-20 group-hover/play:opacity-50")} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10 flex items-center justify-center">
              {streamLoading ? (
                <svg className="animate-spin w-5 h-5 lg:w-7 lg:h-7" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : isPlaying ? (
                <Pause className={cn("w-5 h-5 lg:w-7 lg:h-7", userAvatar ? "text-white" : "text-black")} fill="currentColor" />
              ) : (
                <Play className={cn("w-5 h-5 lg:w-7 lg:h-7 ml-1", userAvatar ? "text-white" : "text-black")} fill="currentColor" />
              )}
            </div>

            <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
              <Camera size={16} className="text-white" />
            </motion.div>
          </motion.button>

          <button onClick={onNext} disabled={!canNext && repeat === 'off' && !shuffle} className={cn("transition-all duration-300", (canNext || shuffle || repeat !== 'off') ? "text-slate-400 hover:text-white hover:scale-110" : "text-zinc-800 cursor-not-allowed")}>
            <SkipForward size={20} fill="currentColor" />
          </button>

          <button
            onClick={onToggleRepeat}
            title={repeat === 'off' ? 'Repeat Off' : repeat === 'one' ? 'Repeat One' : 'Repeat All'}
            className={cn(
              "p-2 rounded-xl transition-all duration-300 active:scale-90",
              repeat !== 'off' ? "text-primary" : "text-slate-600 hover:text-white"
            )}
          >
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* ── Secondary Controls (Right) */}
        <div className="flex items-center justify-end gap-2 lg:gap-6">
          <div className="flex items-center gap-3 group/volume w-24 lg:w-32">
             <button onClick={onToggleMute} className="text-slate-500 hover:text-white transition-all">
                {volume === 0 ? <VolumeX size={16} className="text-rose-500" /> : <Volume2 size={16} />}
             </button>
             <div className="relative flex-1 h-1 flex items-center group/slider cursor-pointer">
                <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden" />
                <div className="absolute h-full left-0 bg-white/40 group-hover/volume:bg-primary transition-all" style={{ width: `${volume * 100}%` }} />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolumeChange} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
                {/* Volume % tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-lg text-[10px] font-black text-white whitespace-nowrap shadow-lg">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
             </div>
          </div>

          <div className="h-6 w-px bg-white/5" />

          <div className="flex items-center gap-0.5">
             <span className="text-[10px] font-black text-slate-500 mr-2 opacity-60 tabular-nums">{duration || '0:00'}</span>
             <ControlToggle active={showQueue} onClick={onToggleQueue} icon={<ListMusic size={18}/>} label={t.player.queue} />
             <ControlToggle active={showEq} onClick={onToggleEq} icon={<SlidersHorizontal size={18}/>} label={t.player.equalizer} />
             <ControlToggle active={showLyrics} onClick={onToggleLyrics} icon={<Mic2 size={18}/>} label={t.player.lyrics} />
             
             <div className="relative group/timer">
                <ControlToggle active={sleepTimer.isActive || showTimerMenu} onClick={() => setShowTimerMenu(!showTimerMenu)} icon={<Timer size={18}/>} label={t.player.sleepTimer} />
                <AnimatePresence>
                  {showTimerMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full right-0 mb-4 w-40 glass border border-white/10 rounded-2xl shadow-2xl py-2 z-[70] overflow-hidden">
                       {[15, 30, 60].map(m => (
                         <button key={m} onClick={() => { sleepTimer.startTimer(m); setShowTimerMenu(false); }} className="w-full px-5 py-3 text-left text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">{m} {t.player.sleepTimerMins}</button>
                       ))}
                       <button onClick={() => { sleepTimer.cancelTimer(); setShowTimerMenu(false); }} className="w-full px-5 py-3 text-left text-[11px] font-black text-rose-500 hover:bg-rose-500/10 transition-all uppercase tracking-widest">{t.player.sleepTimerOff}</button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

              <div className="relative">
                <ControlToggle active={showPersonalize} onClick={() => setShowPersonalize(!showPersonalize)} icon={<Sparkles size={18}/>} label="Personalize" />
                <AnimatePresence>
                  {showPersonalize && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full right-0 mb-4 w-48 glass border border-white/10 rounded-2xl shadow-2xl p-3 z-[70]">
                       <div className="space-y-1">
                         <button onClick={() => bgInputRef.current?.click()} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group">
                            <ImageIcon size={14} className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold text-slate-300">Set Backdrop</span>
                         </button>
                         <button onClick={() => avatarInputRef.current?.click()} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group">
                            <Camera size={14} className="text-pink-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold text-slate-300">Change Avatar</span>
                         </button>
                         <button onClick={onResetPersonalization} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-500/10 transition-all text-left group">
                            <RotateCcw size={14} className="text-slate-500 group-hover:text-rose-500" />
                            <span className="text-[11px] font-bold text-slate-500 group-hover:text-rose-500">Reset Canvas</span>
                         </button>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <ControlToggle active={false} onClick={onMiniPlayer} icon={<Maximize2 size={18}/>} label={t.player.miniPlayer} />
          </div>
        </div>

      </div>
    </footer>
    </div>
  );
};

const ControlToggle: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={cn(
      "p-2.5 rounded-xl transition-all duration-500 active:scale-90 border border-transparent",
      active 
        ? "text-primary bg-primary/10 border-primary/20" 
        : "text-slate-500 hover:text-white hover:bg-white/[0.04]"
    )}
  >
    {icon}
  </button>
);
