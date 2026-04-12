import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Award, Music2, Sparkles, ArrowLeft, TrendingUp, Clock, History, Mic2, Disc } from 'lucide-react';
import { cn } from '../lib/utils';
import { AuraVisualizer } from './AuraVisualizer';

interface StatsProps {
  show: boolean;
  onClose: () => void;
  onPlay: (track: any) => void;
  analyserRef?: React.RefObject<AnalyserNode | null>;
  accentColor?: string;
}

interface StatsData {
  totalMinutes: number;
  totalTracks: number;
  topTracks: any[];
  topChannels: any[];
  persona: string;
  mainVibe: string;
}

export const StatsWrapped: React.FC<StatsProps> = ({ 
  show, 
  onClose, 
  onPlay,
  analyserRef,
  accentColor = '255, 255, 255'
}) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'main' | 'artist'>('main');
  const [activeArtist, setActiveArtist] = useState<any | null>(null);
  const [artistTracks, setArtistTracks] = useState<any[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await window.ipcRenderer.invoke('getListeningStats');
      setStats(data);
    } catch {}
    setLoading(false);
  };

  const handleArtistClick = async (artist: any) => {
    if (!artist) return;
    setActiveArtist(artist);
    setArtistLoading(true);
    setView('artist');
    try {
      const data = await window.ipcRenderer.invoke('getArtistStats', artist.channel);
      setArtistTracks(data.topTracks || []);
    } catch (err) {
      console.error('Failed to fetch artist stats:', err);
    } finally {
      setArtistLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchStats();
      setView('main');
    }
  }, [show]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (show) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [show, onClose]);

  const handleShare = async () => {
    if (!stats) return;
    const text = `Aura Music Wrapped 2026\nPersona: ${stats.persona}\nPlayed: ${stats.totalMinutes} minutes\nVibe: ${stats.mainVibe}\nTop Artist: ${stats.topChannels[0]?.channel || 'Aura'}\n\nExperience your sound on Aura.`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.log('Clipboard copy failed');
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 sm:p-6"
        >
          <motion.div
            ref={wrapRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-[2.5rem] bg-zinc-950/40 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] no-scrollbar"
          >
            {/* Ambient Aura Background */}
            <div 
              className="absolute inset-0 opacity-10 blur-[120px] pointer-events-none transition-all duration-1000"
              style={{ backgroundColor: `rgb(${accentColor})` }}
            />
            {analyserRef && (
              <AuraVisualizer 
                analyserRef={analyserRef} 
                color={accentColor} 
                className="absolute inset-x-0 -bottom-20 h-64 opacity-20 pointer-events-none mix-blend-screen"
                height={256}
                count={80}
              />
            )}
            {/* Header */}
            <div className="flex items-center justify-between p-10 pb-6 shrink-0 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg" onClick={() => setView('main')}>
                   <Sparkles className="text-white" size={20} />
                </div>
                <div>
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-0.5">Recap 2026</h3>
                   <p className="text-sm font-bold text-white">Aura Music Experience</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5">
                 <X size={24} />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 p-20">
                 <Loader2 size={32} className="animate-spin text-primary" />
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Decoding your soundscape...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-10">
                 <AnimatePresence mode="wait">
                    {view === 'main' ? (
                      <motion.div key="main" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-12">
                         {/* Persona Section */}
                         <div className="flex flex-col items-center text-center gap-6">
                            <div className="relative group cursor-pointer" onClick={() => handleArtistClick(stats?.topChannels[0])}>
                               <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
                               <div className="relative w-48 h-48 rounded-full border-4 border-white/10 p-2 overflow-hidden shadow-2xl transition-transform group-hover:scale-[1.02]">
                                  {stats?.topChannels[0]?.thumbnail ? (
                                    <img src={stats.topChannels[0].thumbnail} className="w-full h-full object-cover rounded-full" alt="" />
                                  ) : (
                                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                       <Disc size={64} className="text-white/10 animate-spin-slow" />
                                    </div>
                                  )}
                               </div>
                               <div className="absolute bottom-2 right-2 w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl border border-white/20 -rotate-12 group-hover:rotate-0 transition-transform">
                                  <Award size={24} className="text-white" />
                               </div>
                            </div>
                            <div className="space-y-3">
                               <h1 className="text-5xl premium-title leading-tight tracking-tight">
                                  {stats?.persona}
                               </h1>
                               <div className="flex items-center gap-3 justify-center">
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">{stats?.mainVibe}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Rank: Elite</span>
                               </div>
                            </div>
                         </div>

                         {/* Quick Stats Grid */}
                         <div className="grid grid-cols-3 gap-4">
                            <StatCard label="Minutes" value={stats?.totalMinutes || 0} icon={<Clock size={14}/>} />
                            <StatCard label="Tracks" value={stats?.totalTracks || 0} icon={<Music2 size={14}/>} />
                            <StatCard label="Activity" value={stats?.mainVibe || ''} icon={<TrendingUp size={14}/>} />
                         </div>

                         {/* Lists Content */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                               <SectionTitle label="Top Giai Điệu" color="bg-primary" />
                               <div className="space-y-2">
                                  {stats?.topTracks.slice(0, 5).map((track, i) => (
                                    <StatsRow key={track.id} track={track} index={i} onClick={() => onPlay({...track, duration: track.duration || '0:00'})} />
                                  ))}
                               </div>
                            </div>
                            <div className="space-y-6">
                               <SectionTitle label="Top Nghệ Sĩ" color="bg-secondary" />
                               <div className="space-y-2">
                                  {stats?.topChannels.slice(0, 5).map((artist, i) => (
                                    <ArtistRow key={artist.channel} artist={artist} index={i} onClick={() => handleArtistClick(artist)} />
                                  ))}
                               </div>
                            </div>
                         </div>

                         {/* Share Footer */}
                         <div className="pt-10 flex flex-col items-center gap-4">
                            <button onClick={handleShare} className="flex items-center gap-4 px-10 py-4 bg-white text-black rounded-[2rem] text-xs font-bold uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                               <Share2 size={16} />
                               <span>Share Wrapped</span>
                            </button>
                            <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.5em]">Aura Music • Internal Metadata</p>
                         </div>
                      </motion.div>
                    ) : (
                      <motion.div key="artist" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-10">
                         <button onClick={() => setView('main')} className="flex items-center gap-3 text-slate-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors mb-6 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Main
                         </button>

                         <header className="flex items-center gap-8">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/5 shadow-2xl shrink-0">
                               {activeArtist?.thumbnail ? (
                                 <img src={activeArtist.thumbnail} className="w-full h-full object-cover" alt="" />
                               ) : (
                                 <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                    <Mic2 size={64} className="text-white/10" />
                                 </div>
                               )}
                            </div>
                            <div className="space-y-2">
                               <h1 className="text-5xl premium-title tracking-tighter">{activeArtist?.channel}</h1>
                               <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                                  <History size={14} />
                                  <span>Visualized Experience</span>
                               </div>
                            </div>
                         </header>

                         <div className="space-y-6">
                            <SectionTitle label="Top tracks from this artist" color="bg-primary" />
                            <div className="space-y-2">
                               {artistLoading ? <div className="h-40 flex items-center justify-center text-slate-500 italic text-xs">Loading sync...</div> : artistTracks.map((tr, i) => (
                                 <StatsRow key={tr.id} track={tr} index={i} onClick={() => onPlay({...tr, channel: activeArtist?.channel, duration: tr.duration || '0:00'})} />
                               ))}
                            </div>
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Loader2 = ({ size, className }: { size: number; className?: string }) => <div className={cn("inline-block", className)}><Sparkles size={size} /></div>;

const SectionTitle: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div className="flex items-center gap-3">
    <div className={cn("w-1 h-3 rounded-full opacity-60", color)} />
    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">{label}</h3>
  </div>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-6 rounded-[2rem] bg-white/[0.04] backdrop-blur-md border border-white/10 text-center group hover:bg-white/[0.08] transition-all shadow-lg hover:shadow-primary/5">
    <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">{icon} <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span></div>
    <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform truncate">{value}</div>
  </div>
);

const StatsRow: React.FC<{ track: any; index: number; onClick: () => void }> = ({ track, index, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-5 p-3 rounded-2xl hover:bg-white/[0.04] transition-all text-left group">
     <span className="w-4 text-[10px] font-bold text-slate-700">{index + 1}</span>
     <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shrink-0 shadow-md">
        <img src={track.thumbnail} className="w-full h-full object-cover" alt="" />
     </div>
     <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{track.title}</p>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{track.channel}</p>
     </div>
     {track.playCount && <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter shrink-0">{track.playCount} plays</span>}
  </button>
);

const ArtistRow: React.FC<{ artist: any; index: number; onClick: () => void }> = ({ artist, index, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-5 p-3 rounded-2xl hover:bg-white/[0.04] transition-all text-left group">
     <span className="w-4 text-[10px] font-bold text-slate-700">{index + 1}</span>
     <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-900 border border-white/5 shrink-0 shadow-lg">
        <img src={artist.thumbnail} className="w-full h-full object-cover" alt="" />
     </div>
     <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{artist.channel}</p>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{artist.playCount} PLAYS</p>
     </div>
     <ArrowLeft className="rotate-180 text-slate-800 group-hover:text-slate-400 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" size={14} />
  </button>
);
