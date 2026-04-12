import React from 'react';
import { Play, Pause, Heart, Loader2, ListPlus, HardDriveDownload, Music2, TrendingUp, Sparkles, Zap, Flame, DownloadCloud } from 'lucide-react';
import type { Track } from '../lib/constants';
import { cn, formatViews, displayDuration } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/* ────────────────────────────────────────────────────────────
   PREMIUM MOOD ENGINE
   Analyzes keywords to assign a high-fidelity visual vibe.
──────────────────────────────────────────────────────────── */
interface MoodTag {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  glow: string;
}

function detectMood(title: string): MoodTag | null {
  const t = title.toLowerCase();
  
  // V-POP / LOCAL FAVORITES
  if (/v-pop|nhạc trẻ|vpop|việt|nhạc việt/.test(t))
    return { label: 'V-POP', icon: <Sparkles size={10} />, color: '#F472B6', bg: 'rgba(219,39,119,0.15)', glow: 'shadow-pink-500/20' };
    
  // PHONK / HIGH ENERGY
  if (/phonk|bass|drift|cowbell|street|aggressive/.test(t))
    return { label: 'PHONK', icon: <Zap size={10} />, color: '#A78BFA', bg: 'rgba(124,58,237,0.15)', glow: 'shadow-violet-500/20' };

  // CHILL / LOFI / STUDY
  if (/lo.?fi|chill|study|focus|work|coffee|piano|relax|vibe|calm/.test(t))
    return { label: 'CHILL', icon: <DownloadCloud size={10} />, color: '#60A5FA', bg: 'rgba(37,99,235,0.15)', glow: 'shadow-blue-500/20' };

  // DEEP / SAD / NOSTALGIA
  if (/sad|buồn|mưa|rain|lonely|tear|cry|nostalgia|kỷ niệm|xưa/.test(t))
    return { label: 'DEEP', icon: <TrendingUp size={10} />, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', glow: 'shadow-slate-500/10' };

  // ENERGY / EDM / DANCE
  if (/hype|edm|drop|dance|party|remix|beat|rave|festival|năng lượng/.test(t))
    return { label: 'ENERGY', icon: <Flame size={10} />, color: '#FB923C', bg: 'rgba(234,88,12,0.15)', glow: 'shadow-orange-500/20' };

  return null;
}

interface TrackCardProps {
  track: Track;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  streamLoading: boolean;
  isLiked: boolean;
  isCached?: boolean;
  isDownloading?: boolean;
  onPlay: (t: Track) => void;
  onLike: (t: Track) => void;
  onDownload?: (t: Track) => void;
  onAddToPlaylist: (t: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  index,
  isActive,
  isPlaying,
  streamLoading,
  isLiked,
  isCached,
  isDownloading,
  onPlay,
  onLike,
  onDownload,
  onAddToPlaylist,
}) => {
  const [hovered, setHovered] = React.useState(false);
  const moodTag = detectMood(track.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ 
        delay: index * 0.03, 
        duration: 0.5,
        ease: 'easeOut'
      }}
      className={cn(
        "group p-4 rounded-[2rem] cursor-pointer transition-all duration-500 relative border overflow-hidden",
        isActive 
          ? "bg-white/[0.08] border-primary/40 shadow-[0_30px_60px_rgba(0,0,0,0.5)] ring-2 ring-primary/40" 
          : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.06] shadow-xl"
      )}
      onMouseEnter={() => {
        setHovered(true);
        window.ipcRenderer.invoke('prefetchStreamUrl', track.id, {
          title: track.title,
          thumbnail: track.thumbnail,
          channel: track.channel,
          duration: track.duration,
        });
      }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(track)}
    >
      {/* Active Breathing Glow Layer */}
      <AnimatePresence>
        {isActive && isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ── Artwork Section: Kinetic Cinematic */}
      <div className="aspect-video rounded-3xl bg-zinc-900 mb-5 overflow-hidden relative shadow-2xl border border-white/5">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Music2 size={40} className="text-white" />
        </div>
        
        {track.thumbnail && (
          <img
            src={track.thumbnail}
            alt=""
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-[1500ms] ease-out select-none",
              hovered ? "scale-110 blur-[3px] opacity-50" : "scale-100",
              streamLoading && isActive && "opacity-40 grayscale blur-sm"
            )}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* Cinematic Gradient Tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Hover play overlay: Kinetic Glass */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-700 backdrop-blur-[0px] group-hover:backdrop-blur-[2px]",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
           <motion.div
            initial={false}
            animate={{ 
              scale: hovered || isActive ? 1 : 0.7,
              opacity: hovered || isActive ? 1 : 0
            }}
            className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-3xl bg-white/10"
          >
            {streamLoading && isActive ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : isPlaying && isActive ? (
              <Pause className="w-6 h-6 text-white fill-current shadow-white" />
            ) : (
              <Play className="w-6 h-6 text-white fill-current ml-1" />
            )}
          </motion.div>
        </div>

        {/* Time Badge (Floating Glass) */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-2xl text-[10px] font-black text-white/95 border border-white/10 shadow-xl tracking-[0.1em]">
          {displayDuration(track.duration)}
        </div>

        {/* Status Indicators (Top Layer) - Streamlined */}
        <div className="absolute top-4 left-4 flex gap-2">
            {isCached && (
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 backdrop-blur-3xl border border-emerald-500/30 shadow-xl text-emerald-400" title="Offline Ready">
                <HardDriveDownload size={14} />
            </div>
            )}
        </div>
      </div>

      {/* ── Metadata Section: Improved Hierarchy */}
      <div className="flex flex-col gap-4 px-1.5">
        <div className="min-w-0">
          <h4 className={cn(
            "text-[15px] font-black leading-[1.3] line-clamp-2 transition-all duration-500 tracking-tight h-10",
            isActive ? "text-primary" : "text-white/95 group-hover:text-white"
          )}>
            {track.title}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.05em]">
            <p className="truncate max-w-[130px] hover:text-white transition-colors capitalize">{track.channel.toLowerCase()}</p>
            <span className="w-1 h-1 rounded-full bg-slate-700/50" />
            <p className="opacity-70">{formatViews(track.views)} Views</p>
          </div>
        </div>

        {/* Footer Actions: Refined Glass Pills */}
        <div className="flex items-center justify-between mt-1 pt-4 border-t border-white/[0.04] h-12">
          {moodTag ? (
            <div 
              className={cn(
                  "glass-pill px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 shadow-lg h-8 transition-transform group-hover:scale-105",
                  moodTag.glow
              )}
              style={{ background: moodTag.bg, color: moodTag.color }}
            >
              <span className="opacity-70 group-hover:opacity-100 transition-opacity">{moodTag.icon}</span>
              {moodTag.label}
            </div>
          ) : <div className="h-8" />}

          <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-all duration-700 translate-x-3 group-hover:translate-x-0">
            {/* Sync / Download Action */}
            {!isCached && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownload?.(track); }}
                disabled={isDownloading}
                className={cn(
                  "p-2 rounded-xl hover:bg-white/5 transition-all duration-300",
                  isDownloading ? "text-primary animate-pulse" : "text-slate-500 hover:text-emerald-400"
                )}
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <HardDriveDownload size={16} />}
              </button>
            )}

            <button
              onClick={e => { e.stopPropagation(); onLike(track); }}
              className={cn(
                "p-2 rounded-xl hover:bg-white/5 transition-all duration-300",
                isLiked ? "text-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]" : "text-slate-500 hover:text-white"
              )}
            >
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onAddToPlaylist(track); }}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all duration-300"
            >
              <ListPlus size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
