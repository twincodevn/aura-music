import React from 'react';
import { Headphones, Coffee, Brain, CloudRain, Target, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface PodcastEngineProps {
  onSearch: (query: string) => void;
}

const PODCAST_CATEGORIES = [
  {
    id: 'focus',
    label: 'Deep Focus',
    description: 'Binaural beats, lofi, and ambient sounds for intense studying.',
    query: 'Lofi deep focus study relax 24/7',
    icon: <Target size={24} />,
    color: 'from-blue-500/20 to-indigo-600/20',
    accent: 'text-indigo-400'
  },
  {
    id: 'podcast',
    label: 'Podcast Trí Tuệ',
    description: 'Talkshows, knowledge, business, and self-improvement.',
    query: 'Podcast phát triển bản thân trí tuệ doanh nghiệp',
    icon: <Brain size={24} />,
    color: 'from-emerald-500/20 to-teal-600/20',
    accent: 'text-emerald-400'
  },
  {
    id: 'asmr',
    label: 'Mưa & Tiếng Ồn Trắng',
    description: 'ASMR, rain sounds, white noise for sleep and relaxation.',
    query: 'ASMR tiếng mưa rơi ngủ ngon white noise',
    icon: <CloudRain size={24} />,
    color: 'from-slate-500/20 to-zinc-600/20',
    accent: 'text-slate-400'
  },
  {
    id: 'cafe',
    label: 'Không Gian Quán Cafe',
    description: 'Acoustic background music mixed with coffee shop ambiance.',
    query: 'Nhạc nền quán cafe chill acoustic',
    icon: <Coffee size={24} />,
    color: 'from-amber-600/20 to-orange-700/20',
    accent: 'text-orange-400'
  }
];

export const PodcastEngine: React.FC<PodcastEngineProps> = ({ onSearch }) => {
  return (
    <div className="flex flex-col gap-10 p-4 lg:p-8">
      {/* ── Section Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-indigo-500 rounded-full opacity-60" />
          <h2 className="text-3xl lg:text-4xl premium-title flex items-center gap-3">
            <Headphones className="text-indigo-400" size={32} /> Focus & Podcasts
          </h2>
        </div>
        <p className="text-slate-400 text-sm font-semibold ml-6">
          Chữa lành tâm hồn, cải thiện sự tập trung và xoa dịu thần kinh.
        </p>
      </div>

      {/* ── Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PODCAST_CATEGORIES.map((cat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={cat.id}
          >
            <button
              onClick={() => onSearch(cat.query)}
              className={cn(
                "w-full text-left p-6 lg:p-8 rounded-3xl backdrop-blur-2xl bg-gradient-to-br border border-white/5 shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden",
                cat.color
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner", cat.accent)}>
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{cat.label}</h3>
                  <p className="text-sm font-semibold text-white/50 leading-relaxed">{cat.description}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity text-white/70">
                  <Zap size={14} /> Bắt đầu ngay
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
