import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Track } from '../lib/constants';
import { Play, Pause, Loader2, Users, ChevronRight, Zap, Sparkles, Sunrise, Target, Coffee, CloudRain, HeartPulse, Flame, Moon, Sun, CloudSun, Sunset } from 'lucide-react';
import { cn } from '../lib/utils';

interface MoodChip {
  icon: React.ReactNode;
  label: string;
  query: string;
  color: string;
  bg: string;
  ambientPrimary: string;
  ambientSecondary: string;
}

const MOODS: MoodChip[] = [
  {
    icon: <Sunrise size={16} />, label: 'Morning', query: 'nhạc buổi sáng chill 2025',
    color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',
    ambientPrimary: '251,191,36', ambientSecondary: '249,115,22',
  },
  {
    icon: <Target size={16} />, label: 'Focus', query: 'lofi study focus beats 2024',
    color: '#818CF8', bg: 'rgba(129,140,248,0.1)',
    ambientPrimary: '99,102,241', ambientSecondary: '139,92,246',
  },
  {
    icon: <Coffee size={16} />, label: 'Chill', query: 'nhạc chill café việt nam',
    color: '#22D3EE', bg: 'rgba(34,211,238,0.1)',
    ambientPrimary: '6,182,212', ambientSecondary: '14,165,233',
  },
  {
    icon: <CloudRain size={16} />, label: 'Rainy', query: 'nhạc buồn mưa lo-fi 2024',
    color: '#94A3B8', bg: 'rgba(148,163,184,0.1)',
    ambientPrimary: '100,116,139', ambientSecondary: '71,85,105',
  },
  {
    icon: <HeartPulse size={16} />, label: 'Deep', query: 'nhạc tâm trạng emotional vpop 2025',
    color: '#F472B6', bg: 'rgba(244,114,182,0.1)',
    ambientPrimary: '236,72,153', ambientSecondary: '167,139,250',
  },
  {
    icon: <Flame size={16} />, label: 'Hype', query: 'nhạc hype edm remix 2025',
    color: '#FB7185', bg: 'rgba(251,113,133,0.1)',
    ambientPrimary: '239,68,68', ambientSecondary: '249,115,22',
  },
  {
    icon: <Moon size={16} />, label: 'Night', query: 'nhạc đêm khuya buồn 2025',
    color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',
    ambientPrimary: '96,165,250', ambientSecondary: '139,92,246',
  },
  {
    icon: <Sparkles size={16} />, label: 'Magic', query: 'nhạc tiên cảnh lofi 4k',
    color: '#A855F7', bg: 'rgba(168,85,247,0.1)',
    ambientPrimary: '168,85,247', ambientSecondary: '236,72,153',
  },
];

const GENRES = [
  { label: 'Bolero', query: 'nhạc bolero trữ tình hay nhất' },
  { label: 'Indie Việt', query: 'nhạc indie việt mới nhất' },
  { label: 'Rap Việt', query: 'rap việt hot nhất 2024 2025' },
  { label: 'K-Pop', query: 'top kpop new hits 2025' },
  { label: 'US-UK', query: 'billboard hot 100 current official' },
  { label: 'EDM', query: 'electronic dance music festival 2025' },
  { label: 'Acoustic', query: 'nhạc acoustic việt nam nhẹ nhàng' },
  { label: 'Remix', query: 'nhạc trẻ remix tik tok hay nhất' },
];

const FRIENDS = [
  { name: 'Minh', initial: 'M', song: 'Chúng Ta Của Hiện Tại', color: 'bg-indigo-500' },
  { name: 'Linh', initial: 'L', song: 'See tình', color: 'bg-rose-500' },
  { name: 'Tuấn', initial: 'T', song: 'Waiting for You', color: 'bg-sky-500' },
  { name: 'Hà', initial: 'H', song: 'Bước qua mùa cô đơn', color: 'bg-emerald-500' },
  { name: 'Nam', initial: 'N', song: 'Thức tới 3 giờ', color: 'bg-amber-500' },
];

function getTimeContext(): { icon: React.ReactNode; label: string; defaultMood: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 9)  return { icon: <Sunrise size={12} />, label: 'Bình minh rực rỡ', defaultMood: 'Khởi đầu ngày mới đầy năng lượng' };
  if (h >= 9 && h < 12) return { icon: <Sun size={12} />, label: 'Nắng mai rạng rỡ', defaultMood: 'Tập trung cao độ · Sáng tạo' };
  if (h >= 12 && h < 14) return { icon: <CloudSun size={12} />, label: 'Trưa nắng yên bình', defaultMood: 'Thư giãn · Nghỉ ngơi giữa giờ' };
  if (h >= 14 && h < 18) return { icon: <Sun size={12} className="opacity-70" />, label: 'Chiều tà dịu êm', defaultMood: 'Deep work · Say mê công việc' };
  if (h >= 18 && h < 21) return { icon: <Sunset size={12} />, label: 'Hoàng hôn lãng mạn', defaultMood: 'Giai điệu thư giãn sau giờ làm' };
  if (h >= 21 && h < 24) return { icon: <Moon size={12} />, label: 'Đêm muộn tâm tình', defaultMood: 'Góc nhỏ bình yên · Suy tư' };
  return { icon: <Moon size={12} className="opacity-50" />, label: 'Nửa đêm vắng lặng', defaultMood: 'Cô đơn nhưng không lẻ loi' };
}

interface HeroCardProps {
  track: Track | null;
  isPlaying: boolean;
  streamLoading: boolean;
  onPlay: () => void;
}

const HeroCard: React.FC<HeroCardProps> = ({ track, isPlaying, streamLoading, onPlay }) => {
  const ctx = getTimeContext();
  
  if (!track) return <div className="h-52 rounded-[32px] bg-zinc-900 border border-white/5 flex items-center justify-center opacity-40 italic text-sm">Waiting for recommendation...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-[2rem] overflow-hidden min-h-[220px] lg:h-60 group cursor-pointer shadow-2xl border border-white/5 hover:border-primary/30 glass-card mb-4 transition-all duration-500 hover:shadow-primary/10"
      onClick={onPlay}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
        style={{ backgroundImage: `url(${track.thumbnail})`, filter: 'blur(40px) brightness(0.4)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      
      <div className="relative z-10 h-full flex items-start gap-8 px-8 lg:px-12 pt-10 pb-8">
        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
          {isPlaying && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-4 border-background">
               <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2">{ctx.icon} {ctx.label}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
              Gợi ý dựa trên gu nhạc của bạn
            </div>
          </div>
          <h2 className="text-3xl premium-title leading-tight mb-2 drop-shadow-md truncate-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
            {track.title}
          </h2>
          <p className="text-sm font-semibold text-slate-400 mb-4">{track.channel}</p>
          
          <div className="flex items-center gap-3">
            <button
               onClick={(e) => { e.stopPropagation(); onPlay(); }}
               className="flex items-center gap-3 px-6 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors shadow-lg"
            >
              {streamLoading ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY NOW'}</span>
            </button>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
               {ctx.defaultMood}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const VibeEngine: React.FC<VibeEngineProps> = ({
  trending,
  playHistory,
  currentTrack,
  isPlaying,
  streamLoading,
  onPlay,
  onSearch,
  onDynamicMix,
  children,
}) => {
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const heroTrack = currentTrack ?? trending[0] ?? null;

  return (
    <div className="flex flex-col gap-10">
      {/* ── Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-primary rounded-full opacity-60" />
          <h2 className="text-2xl lg:text-3xl premium-title flex items-center gap-3">
            <Zap className="text-primary" size={28} /> Vibe Engine
          </h2>
        </div>
        <button
          onClick={onDynamicMix}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-all"
        >
          <Sparkles size={14} className="text-primary" />
          <span>Smart Mix</span>
        </button>
      </div>

      {/* ── Hero & Moods */}
      <div className="flex flex-col gap-6">
        <HeroCard track={heroTrack} isPlaying={isPlaying && currentTrack?.id === heroTrack?.id} streamLoading={streamLoading && currentTrack?.id === heroTrack?.id} onPlay={() => heroTrack && onPlay(heroTrack, trending)} />
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-1">
          {MOODS.map(mood => (
            <button
              key={mood.label}
              onClick={() => { setActiveMood(mood.label); onSearch(mood.query); }}
              className={cn(
                "glass-pill px-6 py-4 rounded-[22px] text-[11px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-3 active:scale-95 group relative",
                activeMood === mood.label 
                  ? "bg-white/10 border-white/40 ring-1 ring-white/20 glow-active" 
                  : "text-slate-400 hover:text-white"
              )}
              style={activeMood === mood.label ? { boxShadow: `0 0 25px rgba(${mood.ambientPrimary}, 0.2)` } : {}}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" 
                style={{ background: `radial-gradient(circle at center, rgba(${mood.ambientPrimary}, 0.8) 0%, transparent 70%)` }}
              />
              <span className="relative z-10 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" style={{ color: activeMood === mood.label ? 'white' : mood.color }}>
                {mood.icon}
              </span>
              <span className="relative z-10">{mood.label}</span>
            </button>
          ))}
        </div>

        {/* Genre Hub Row */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-6 pt-2">
          {GENRES.map(genre => (
            <button
              key={genre.label}
              onClick={() => onSearch(genre.query)}
              className="glass-pill px-5 py-2.5 rounded-full text-[10px] font-black text-slate-500 hover:text-primary uppercase tracking-[0.25em] shrink-0"
            >
              <span className="opacity-40 font-normal mr-1">#</span>{genre.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Social Proof / Friends */}
      <div className="p-6 rounded-[32px] bg-zinc-900/50 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Users size={12} />
            <span>Listening Now</span>
          </div>
          <div className="flex -space-x-2">
            {FRIENDS.slice(0, 3).map((f, i) => (
              <div key={i} className={cn("w-6 h-6 rounded-full border-2 border-zinc-900 flex items-center justify-center text-[8px] font-bold text-white", f.color)}>
                {f.initial}
              </div>
            ))}
            <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[7px] font-black text-white">+2</div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
           {FRIENDS.map((f, i) => (
             <button key={i} onClick={() => onSearch(f.song)} className="flex flex-col items-center gap-2 shrink-0 group">
                <div className={cn("w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center text-sm font-bold text-white group-hover:scale-105 transition-transform shadow-lg", f.color)}>
                  {f.initial}
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-white transition-colors">{f.name}</span>
             </button>
           ))}
           <button className="w-12 h-12 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-slate-600 hover:text-white hover:border-white/20 transition-all shrink-0">
              <ChevronRight size={16} />
           </button>
        </div>
      </div>

      {/* ── Memory Lane: Nostalgia Engine */}
      {playHistory.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-purple-500 rounded-full opacity-60" />
              <h3 className="text-xl premium-title uppercase tracking-tight flex items-center gap-2">
                Memory Lane <Sparkles size={16} className="text-purple-400" />
              </h3>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {playHistory.slice(0, 10).map((track: Track) => (
              <button 
                key={track.id} 
                onClick={() => onPlay(track, playHistory)}
                className="flex flex-col gap-3 w-40 shrink-0 group"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/5">
                  <img src={track.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <Play size={14} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-white truncate group-hover:text-primary transition-colors">{track.title}</p>
                  <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">Một năm trước bạn đã mê mẩn...</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content Grid */}
      <div className="flex flex-col gap-6">
        {children}
      </div>

    </div>
  );
};

export interface VibeEngineProps {
  trending: Track[];
  playHistory: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  streamLoading: boolean;
  onPlay: (track: Track, context?: Track[]) => void;
  onSearch: (query: string, isTrending?: boolean) => void;
  onDynamicMix: () => void;
  children: React.ReactNode;
}
