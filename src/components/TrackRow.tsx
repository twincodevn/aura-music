import { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock, Plus, Trash2, HardDriveDownload, Loader2, Music2 } from 'lucide-react';
import type { Track } from '../lib/constants';
import { cn, getTrackCategory, displayDuration } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackRowProps {
  track: Track;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  streamLoading?: boolean;
  isLiked?: boolean;
  isCached?: boolean;
  isDownloading?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onPlay: (track: Track) => void;
  onLike?: (track: Track) => void;
  onDownload?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onRemove?: (videoId: string) => void;
  onSelect?: (id: string) => void;
}

export function TrackRow({
  track,
  index,
  isActive,
  isPlaying,
  streamLoading,
  isLiked,
  isCached,
  isDownloading,
  isSelected,
  isSelectionMode,
  onPlay,
  onLike,
  onDownload,
  onAddToPlaylist,
  onRemove,
  onSelect
}: TrackRowProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
        className={cn(
          "group flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 border",
          isActive ? "bg-white/5 border-white/5 shadow-inner" : "border-transparent",
          isSelected ? "bg-primary/10 border-primary/20" : ""
        )}
        onClick={() => isSelectionMode && onSelect ? onSelect(track.id) : onPlay(track)}
      >
        {/* Index / Indicator */}
        <div className="w-6 text-center text-xs font-bold text-slate-600 group-hover:text-slate-400 shrink-0">
          {isActive && isPlaying && !streamLoading ? (
            <div className="flex items-center justify-center gap-[2px] h-3">
               <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-primary rounded-full" />
               <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-primary rounded-full" />
               <motion.div animate={{ height: [6, 10, 6] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-primary rounded-full" />
            </div>
          ) : isActive && streamLoading ? (
            <Loader2 size={12} className="animate-spin text-primary mx-auto" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Artwork: Square 1:1 */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-800 shadow-sm border border-white/5">
          {track.thumbnail ? (
            <img
              src={track.thumbnail}
              alt={track.title}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-transform duration-500",
                isActive ? "scale-105" : "scale-100",
                streamLoading && isActive && "opacity-40 grayscale"
              )}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <Music2 size={16} className="text-slate-700" />
            </div>
          )}
          
          <div className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200",
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {isPlaying && isActive ? (
              <Pause size={14} className="text-white fill-white" />
            ) : (
              <Play size={14} className="text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Info Row */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "text-sm font-bold truncate transition-colors",
              isActive ? "text-primary" : "text-slate-100 group-hover:text-white"
            )}>
              {track.title}
            </h4>
            {isCached && <HardDriveDownload size={12} className="text-emerald-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[11px] font-semibold text-slate-500 truncate opacity-80">{track.channel}</p>
            {(() => {
              const cat = getTrackCategory(track.duration);
              if (!cat) return null;
              return (
                <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/5">
                  {cat.label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Duration Column */}
        <div className="hidden sm:flex items-center justify-end w-20 text-slate-500 font-mono text-[11px] opacity-60 group-hover:opacity-100 transition-opacity pr-6 shrink-0">
          <span>{displayDuration(track.duration)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={(e) => { e.stopPropagation(); onLike?.(track); }}
            className={cn(
              "p-2 rounded-lg hover:bg-white/5 transition-colors",
              isLiked ? "text-pink-500" : "text-slate-600 hover:text-white"
            )}
          >
            <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToPlaylist?.(track); }}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-600 hover:text-white transition-colors"
          >
            <Plus size={15} />
          </button>
          {!isCached && (
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                onDownload?.(track);
              }}
              disabled={isDownloading}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDownloading ? "text-primary animate-pulse" : "text-slate-600 hover:text-emerald-500"
              )}
              title={isDownloading ? "Downloading..." : "Download for offline"}
            >
              {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <HardDriveDownload size={15} />}
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(track.id); }}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-600 hover:text-red-500 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              e.preventDefault();
              setShowMenu(!showMenu);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors z-20",
              showMenu ? "bg-white/10 text-white" : "hover:bg-white/5 text-slate-700 hover:text-white"
            )}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </motion.div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-4 top-14 w-52 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-30 p-2 overflow-hidden"
            >
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onLike?.(track); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm font-bold text-slate-300 hover:text-white transition-all"
              >
                <Heart size={14} className={cn(isLiked ? "text-pink-500 fill-pink-500" : "")} />
                {isLiked ? 'Đã yêu thích' : 'Yêu thích'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onAddToPlaylist?.(track); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm font-bold text-slate-300 hover:text-white transition-all"
              >
                <Plus size={14} />
                Thêm vào playlist
              </button>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowMenu(false); 
                  window.open(`https://youtu.be/${track.id}`, '_blank');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm font-bold text-slate-300 hover:text-white transition-all border-t border-white/5 mt-1 pt-3"
              >
                <Clock size={14} />
                Mở trên YouTube
              </button>
              {onRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRemove(track.id); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-sm font-bold text-rose-500 transition-all border-t border-white/5 mt-1 pt-3"
                >
                  <Trash2 size={14} />
                  Xóa khỏi ổ đĩa
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
