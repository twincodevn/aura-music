import React, { useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, X, WifiOff, RefreshCcw, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsPanelProps {
  show: boolean;
  onClose: () => void;
  lines: LyricLine[];
  synced: boolean;
  source?: 'official' | 'youtube' | 'none';
  loading: boolean;
  currentTime: number;
  t: any;
  onManualSearch?: (query: string) => void;
  onSeek?: (time: number) => void;
  thumbnail?: string;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  show, onClose, lines, synced, source, loading, currentTime, onManualSearch, onSeek, thumbnail
}) => {
  const [manualQuery, setManualQuery] = React.useState('');
  const [syncOffset, setSyncOffset] = React.useState(0);
  const [shareLine, setShareLine] = React.useState<null | LyricLine>(null);
  const [showResume, setShowResume] = React.useState(false);
  const [autoScrollLocked, setAutoScrollLocked] = React.useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  // activeRef removed — scrolling handled via activeIndex lookup
  const scrollTimeoutRef = useRef<any>(null);

  // Buffer: +0.35s — calm, comfortable anticipation without being too eager.
  const SYNC_BUFFER = 0.35; 

  // Determine current active line index
  const activeIndex = useMemo(() => {
    if (!synced || lines.length === 0) return -1;
    let idx = -1;
    const timeToMatch = currentTime + syncOffset + SYNC_BUFFER;
    for (let i = 0; i < lines.length; i++) {
       if (lines[i].time <= timeToMatch) idx = i;
       else break;
    }
    return idx;
  }, [lines, currentTime, synced, syncOffset]);

  const handleTapSync = (lineTime: number) => {
    const newOffset = lineTime - currentTime;
    setSyncOffset(newOffset);
  };

  const handleResetSync = () => {
    setSyncOffset(0);
    setShowResume(false);
    setAutoScrollLocked(false);
  };

  const handleResumeSync = () => {
    setAutoScrollLocked(false);
    setShowResume(false);
    // Kinetic engine (useLayoutEffect) will recalculate targetY immediately on next render
  };

  const [targetY, setTargetY] = React.useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // FLUID KINETIC SYNC: Real-time Interpolated Engine (Aura 5.9)
  useLayoutEffect(() => {
    if (activeIndex !== -1 && containerRef.current && lineRefs.current[activeIndex] && !autoScrollLocked) {
      const container = containerRef.current;
      const currentElement = lineRefs.current[activeIndex]!;
      const nextElement = lineRefs.current[activeIndex + 1];
      
      const containerHeight = container.clientHeight;
      const currentOffsetTop = currentElement.offsetTop;
      const currentHeight = currentElement.clientHeight;
      
      // Base centered Y for the current line
      const currentY = -(currentOffsetTop) + (containerHeight / 2) - (currentHeight / 2);

      // REAL-TIME INTERPOLATION: Calculate progress towards the next line
      if (nextElement && lines[activeIndex + 1]) {
        const startTime = lines[activeIndex].time;
        const endTime = lines[activeIndex + 1].time;
        const totalDuration = endTime - startTime;
        
        if (totalDuration > 0) {
          const elapsed = (currentTime + syncOffset + SYNC_BUFFER) - startTime;
          const progress = Math.min(1, Math.max(0, elapsed / totalDuration));
          
          const nextOffsetTop = nextElement.offsetTop;
          const nextHeight = nextElement.clientHeight;
          const nextY = -(nextOffsetTop) + (containerHeight / 2) - (nextHeight / 2);
          
          // Interpolate targetY between current and next line proportionally to time
          const interpolatedY = currentY + (nextY - currentY) * progress;
          setTargetY(interpolatedY);
        } else {
          setTargetY(currentY);
        }
      } else {
        setTargetY(currentY); // Stay centered if no next line
      }
    } else if (activeIndex === -1) {
      setTargetY(0);
    }
  }, [activeIndex, currentTime, show, autoScrollLocked]); // Depend on currentTime for Real-Time progress

  // DETECT EXPLICIT USER INTENT ONLY
  const handleUserInteraction = () => {
    if (!autoScrollLocked) setAutoScrollLocked(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setAutoScrollLocked(false);
      setShowResume(false);
    }, 10000); // 10s for more stable reading
  };


  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-[420px] z-50 glass border-l border-white/10 flex flex-col shadow-2xl overflow-hidden"
        >
          {thumbnail && (
            <div className="absolute inset-0 -z-20 scale-110">
              <div 
                className="w-full h-full bg-cover bg-center opacity-30 blur-[100px] transition-all duration-1000 scale-150 rotate-6"
                style={{ backgroundImage: `url(${thumbnail})` }}
              />
              <motion.div animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
              <motion.div animate={{ scale: [1.2, 1, 1.2], x: [0, -60, 0], y: [0, 60, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[140px]" />
            </div>
          )}
          <div className="absolute inset-0 -z-10 bg-black/85 backdrop-blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Mic2 className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">
                  Lyrics
                </h3>
                {synced && (
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  )}>
                    {source === 'youtube' ? 'AUTO' : 'LIVE'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {syncOffset !== 0 && (
                 <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={handleResetSync} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-primary transition-all border border-white/5"><RefreshCcw className="w-3.5 h-3.5" /></motion.button>
              )}
              <button onClick={onClose} className="p-2.5 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-all transform hover:rotate-90 group"><X className="w-4 h-4 group-hover:scale-110" /></button>
            </div>
          </div>

          <div
            ref={containerRef}
            onWheel={handleUserInteraction}
            onTouchStart={handleUserInteraction}
            onKeyDown={handleUserInteraction}
            className="flex-1 overflow-hidden px-10 relative" // removed py-48 and scrollbar-none, added overflow-hidden
          >
            {/* FOCUS PORTAL VIGNETTE */}
            <div className="absolute top-0 left-0 right-0 h-48 lyric-vignette-top z-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-48 lyric-vignette-bottom z-40 pointer-events-none" />
            <div className="absolute top-1/2 left-0 right-0 h-40 -translate-y-1/2 pointer-events-none -z-10 bg-white/5 blur-[100px] rounded-full opacity-50" />

            {!lines || lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-8 text-white/30 text-center">
                 {loading ? <Mic2 className="w-10 h-10 animate-pulse text-primary/30" /> : <WifiOff className="w-8 h-8 opacity-40 text-primary/40" />}
                 <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">{loading ? "Đang tìm lời bài hát..." : "Chưa có lời bài hát"}</p>
                 <input type="text" value={manualQuery} onChange={(e) => setManualQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onManualSearch?.(manualQuery)} placeholder="Tìm lời thủ công..." className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/10 w-full max-w-[280px]" />
              </div>
            ) : (
              <motion.div 
                ref={wrapperRef}
                animate={{ y: targetY }}
                transition={{ type: "spring", damping: 55, stiffness: 100, mass: 1.2 }}
                className="space-y-12 flex flex-col items-start pt-[50vh] pb-[50vh]">
                {lines.map((line, i) => {
                  const isActive = i === activeIndex;
                  const isPast = i < activeIndex;

                  return (
                    <motion.div
                      key={`${i}-${line.time}`}
                      ref={el => { lineRefs.current[i] = el; }}
                      animate={{
                        opacity: isActive ? 1 : isPast ? 0.22 : 0.48,
                      }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      onClick={() => {
                        if (syncOffset !== 0) handleTapSync(line.time);
                        else onSeek?.(line.time);
                      }}
                      className={cn(
                        "relative py-8 px-6 cursor-pointer select-none w-full text-center flex flex-col items-center",
                        isActive ? "text-white lyric-active-glow" : "text-white/40",
                      )}
                    >
                      <div className="flex flex-col items-center gap-6 w-full">
                        <span className={cn(
                          "text-3xl md:text-5xl font-bold tracking-tight leading-[1.2] block transition-all",
                          isActive ? "drop-shadow-2xl" : ""
                        )}>
                          {line.text}
                        </span>
                        
                        {isActive && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={(e) => { e.stopPropagation(); setShareLine(line); }}
                            className="p-3 rounded-full bg-white/10 text-white/30 hover:text-primary transition-all shrink-0 hover:bg-white/20"
                          >
                            <Share2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {showResume && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60]">
                <button onClick={handleResumeSync} className="px-10 py-5 bg-primary text-white rounded-full font-black text-xs uppercase tracking-[0.25em] shadow-3xl flex items-center gap-4 hover:scale-105 active:scale-95 transition-all"><RefreshCcw className="w-4 h-4" /> Quay lại nhịp nhạc</button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {shareLine && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-12" onClick={() => setShareLine(null)}>
                <motion.div initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 40 }} className="w-full max-w-sm aspect-[3/4] relative rounded-[60px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center p-14 text-center border border-white/5" onClick={(e) => e.stopPropagation()}>
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-blue-600/40 -z-10" />
                   {thumbnail && <div className="absolute inset-0 -z-20 opacity-30 blur-3xl"><img src={thumbnail} className="w-full h-full object-cover scale-150" alt="" /></div>}
                   <div className="absolute inset-0 bg-black/60 -z-10" />
                   <Mic2 className="w-12 h-12 text-white/20 mb-20" />
                   <p className="text-3xl font-bold text-white leading-tight mb-16 tracking-tight">"{shareLine.text}"</p>
                   <div className="flex flex-col items-center gap-4"><p className="text-[12px] font-bold uppercase tracking-[0.4em] text-primary/60">Aura Music</p></div>
                   <button onClick={() => setShareLine(null)} className="absolute top-10 right-10 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
