import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import type { EditorialPlaylist } from '../lib/constants';

interface PlaylistCardProps {
  playlist: EditorialPlaylist;
  onClick: (query: string) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group relative flex flex-col gap-4 min-w-[240px] w-64 h-full cursor-pointer"
      onClick={() => onClick(playlist.query)}
    >
      {/* Stacked Artwork Impression */}
      <div className="relative aspect-square">
        {/* Decorative layer 2 (Back) */}
        <div className="absolute inset-x-6 -top-2 h-full rounded-[2.5rem] bg-white/5 border border-white/5 transition-transform duration-500 group-hover:-translate-y-2" />
        
        {/* Decorative layer 1 (Middle) */}
        <div className="absolute inset-x-3 -top-1 h-full rounded-[2.5rem] bg-white/10 border border-white/10 transition-transform duration-500 group-hover:-translate-y-1" />

        {/* Main Artwork (Front) */}
        <div className={cn(
          "relative h-full w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700",
          "bg-gradient-to-br",
          playlist.color
        )}>
          <img
            src={playlist.image}
            alt={playlist.label}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000 group-hover:opacity-100"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
          
          {/* Glass Overlay Elements */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/90 shadow-xl">
              <Sparkles size={10} className="text-yellow-400 fill-yellow-400" />
              <span>Aura Curated</span>
            </div>
            
            {playlist.tag && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-xl",
                  playlist.tag === 'HOT' && "bg-red-500/20 border-red-500/40 text-red-100",
                  playlist.tag === 'TRENDING' && "bg-blue-500/20 border-blue-500/40 text-blue-100",
                  playlist.tag === 'NEW' && "bg-emerald-500/20 border-emerald-500/40 text-emerald-100",
                  playlist.tag === 'EXCLUSIVE' && "bg-amber-500/20 border-amber-500/40 text-amber-100"
                )}
              >
                {playlist.tag === 'HOT' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                <span>{playlist.tag}</span>
              </motion.div>
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-xl scale-75 group-hover:scale-100 transition-transform">
                <Play size={24} fill="currentColor" className="ml-1" />
             </div>
          </div>
        </div>
      </div>

      {/* Text Context */}
      <div className="px-2">
        <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
          <h3 className="text-lg font-black text-white/95 group-hover:text-primary transition-colors tracking-tight truncate">
            {playlist.label}
          </h3>
          <ChevronRight size={16} className="text-slate-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </div>
        <p className="text-[11px] font-medium text-slate-500 line-clamp-2 mt-1 leading-relaxed">
          {playlist.description}
        </p>
      </div>
    </motion.div>
  );
};
