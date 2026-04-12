import { X, Trash2, GripVertical, Play, ListMusic, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Track } from '../lib/constants';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

interface QueuePanelProps {
  show: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track | null;
  onPlay: (track: Track, context?: Track[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onReorder: (tracks: Track[]) => void;
}

export function QueuePanel({
  show,
  onClose,
  queue,
  currentTrack,
  onPlay,
  onRemove,
  onClear,
  onReorder
}: QueuePanelProps) {
  const { t } = useLanguage();
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    if (show && currentTrack) {
      setLoadingRelated(true);
      window.ipcRenderer.invoke('getRelatedTracks', currentTrack.id)
        .then(setRelatedTracks)
        .catch(() => setRelatedTracks([]))
        .finally(() => setLoadingRelated(false));
    }
  }, [currentTrack?.id, show]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-950 shadow-2xl z-[70] flex flex-col border-l border-white/5"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ListMusic className="text-primary" size={24} />
                <h2 className="text-2xl premium-title uppercase tracking-tight">{t.player.upNext}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClear}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  {t.player.clearAll}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400">
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Active Queue */}
              <div className="space-y-4">
                <Reorder.Group axis="y" values={queue} onReorder={onReorder} className="space-y-2">
                  {queue.map((track) => (
                    <Reorder.Item 
                      key={track.id} 
                      value={track}
                      className={cn(
                        "group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-grab active:cursor-grabbing border",
                        currentTrack?.id === track.id 
                          ? "bg-primary/5 border-primary/20 shadow-lg" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                      )}
                    >
                      <GripVertical size={14} className="text-slate-700 group-hover:text-slate-500 shrink-0" />
                      
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                        <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                        {currentTrack?.id === track.id && (
                          <div className="absolute inset-0 bg-primary/40 backdrop-blur-[1px] flex items-center justify-center">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-white rounded-full shadow-lg" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0" onClick={() => onPlay(track)}>
                        <h4 className={cn(
                          "text-sm font-bold truncate tracking-tight transition-colors",
                          currentTrack?.id === track.id ? "text-primary" : "text-white group-hover:text-white"
                        )}>{track.title}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold truncate uppercase tracking-[0.1em] mt-0.5">{track.channel}</p>
                      </div>

                      <button 
                        onClick={() => onRemove(track.id)}
                        className="p-2 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                
                {queue.length === 0 && (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-700 border-2 border-dashed border-white/5 rounded-3xl gap-3">
                    <ListMusic size={32} className="opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">{t.player.emptyQueue}</p>
                  </div>
                )}
              </div>

              {/* Discovery / Related */}
              {currentTrack && (
                <div className="pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 mb-6 px-2">
                    <Sparkles size={18} className="text-primary opacity-60" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                      Discovery Mix
                    </h3>
                  </div>

                  {loadingRelated ? (
                    <div className="space-y-4 px-2">
                       {[1,2,3].map(i => (
                         <div key={i} className="flex items-center gap-4 animate-pulse">
                           <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
                           <div className="flex-1 space-y-2">
                             <div className="h-2 w-3/4 bg-white/5 rounded" />
                             <div className="h-2 w-1/2 bg-white/5 rounded" />
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {relatedTracks.map((track, idx) => (
                        <div 
                          key={`related-${track.id}-${idx}`}
                          className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer border border-transparent hover:border-white/5"
                          onClick={() => {
                            const contextQueue = [track, ...relatedTracks.slice(idx + 1)];
                            onPlay(track, contextQueue);
                          }}
                        >
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                            <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Play size={16} fill="white" className="text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate tracking-tight text-slate-300 group-hover:text-white transition-colors">{track.title}</h4>
                            <p className="text-[10px] text-slate-600 font-semibold truncate uppercase tracking-wider mt-0.5">{track.channel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
