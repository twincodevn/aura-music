import React, { useState } from 'react';
import { Home, Search, Library, Plus, Music, Languages, BarChart3, Sparkles, Disc3, Zap } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { Tab, Track, Playlist } from '../lib/constants';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { InputDialog } from './InputDialog';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onDynamicMixClick: () => void;
  playlists: Playlist[];
  activePlaylistId: number | null;
  onPlaylistClick: (id: number) => void;
  onRenamePlaylist: (id: number, newName: string) => void;
  onCreatePlaylist: () => void;
  cachedCount?: number;
  onOpenStats?: () => void;
  xp?: number;
}

function getStreak(): number {
  try {
    const raw = localStorage.getItem('aura_streak');
    if (!raw) return initStreak();
    const { count, lastDate } = JSON.parse(raw);
    const today = new Date().toDateString();
    if (lastDate === today) return count;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastDate === yesterday) {
      const next = count + 1;
      localStorage.setItem('aura_streak', JSON.stringify({ count: next, lastDate: today }));
      return next;
    }
    return initStreak();
  } catch { return 1; }
}
function initStreak(): number {
  localStorage.setItem('aura_streak', JSON.stringify({ count: 1, lastDate: new Date().toDateString() }));
  return 1;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isPlaying,
  onDynamicMixClick,
  playlists,
  activePlaylistId,
  onPlaylistClick,
  onRenamePlaylist,
  onCreatePlaylist,
  cachedCount,
  onOpenStats,
  xp,
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [streak] = useState(getStreak);

  // Gamification Logic
  const currentXP = xp || 0;
  const XP_PER_LEVEL = 500;
  const level = Math.floor(currentXP / XP_PER_LEVEL) + 1;
  const xpInLevel = currentXP % XP_PER_LEVEL;
  const progress = (xpInLevel / XP_PER_LEVEL) * 100;

  const playlistToRename = playlists.find(p => p.id === renamingId);

  return (
    <aside className="w-[var(--sidebar-w)] my-4 ml-4 rounded-3xl backdrop-blur-[60px] saturate-[180%] bg-white/[0.02] p-4 lg:p-6 flex flex-col gap-6 lg:gap-8 shrink-0 z-50 relative border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_rgba(255,255,255,0.05)] transition-all duration-500 overflow-hidden">
      <div className="titlebar h-8 w-full absolute top-0 left-0" />

      {/* ── Logo Section: Clean & Minimalist */}
      <div className="flex items-center gap-3 pt-4 no-drag">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10">
          <Disc3
            size={22}
            className="text-white"
            style={isPlaying ? { animation: 'spin-vinyl 4s linear infinite' } : {}}
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter text-white leading-none">AURA</h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 opacity-70">Project Music</p>
        </div>
      </div>

      {/* ── Main Navigation */}
      <nav className="flex flex-col gap-1.5 no-drag">
        <NavItem
          icon={<Home size={18}/>}
          label={lang === 'vi' ? 'Trang Chủ' : 'Home'}
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <NavItem
          icon={<Search size={18}/>}
          label={t.sidebar.search}
          active={activeTab === 'search'}
          onClick={() => setActiveTab('search')}
        />
        <NavItem
          icon={<Library size={18}/>}
          label={t.sidebar.library}
          active={activeTab === 'library'}
          onClick={() => setActiveTab('library')}
          badge={cachedCount}
        />
        <NavItem
          icon={<Music size={18}/>}
          label={lang === 'vi' ? 'Focus & Podcast' : 'Focus & Podcast'}
          active={activeTab === 'podcast'}
          onClick={() => setActiveTab('podcast')}
        />
        <NavItem
          icon={<BarChart3 size={18}/>}
          label={lang === 'vi' ? 'Thống Kê' : 'Insights'}
          active={false}
          onClick={() => onOpenStats?.()}
        />
      </nav>

      {/* ── Vibe Level: Gamification 2.0 */}
      <div className="no-drag px-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl -mr-10 -mt-10 group-hover:bg-primary/40 transition-all duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                  <Zap size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Cấp độ</p>
                  <p className="text-xs font-bold text-white">Vibe Master</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-primary">Lv. {level}</p>
              </div>
            </div>
            
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
                 transition={{ duration: 1, ease: 'easeOut' }}
                 className="h-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
               />
            </div>
            <div className="flex items-center justify-between mt-2 overflow-hidden gap-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter whitespace-nowrap">{streak} DAY STREAK</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter whitespace-nowrap">{xpInLevel} / {XP_PER_LEVEL} XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mood DJ Feature: Professional Discovery Card */}
      <div className="no-drag">
        <button
          onClick={onDynamicMixClick}
          className="w-full group relative p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.01] hover:from-primary/10 hover:to-primary/5 border border-white/5 hover:border-primary/40 transition-all duration-500 text-left overflow-hidden shadow-sm shadow-black/20 hover:shadow-primary/10"
        >
          <div className="absolute -top-2 -right-2 p-2 opacity-5 group-hover:opacity-20 transition-all duration-500 rotate-12 group-hover:rotate-0">
            <Sparkles size={64} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Discovery</p>
            </div>
            <p className="text-sm font-bold text-white mb-0.5 group-hover:text-primary transition-colors">Mood DJ</p>
            <p className="text-[10px] text-slate-500 leading-tight font-medium opacity-80">AI picks songs based on your current vibe</p>
          </div>
        </button>
      </div>

      {/* ── Playlists Section */}
      <div className="flex flex-col gap-4 flex-1 min-h-0 no-drag">
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-60">
            {t.sidebar.playlists}
          </p>
          <button
            onClick={onCreatePlaylist}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/5"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => onPlaylistClick(p.id)}
              onContextMenu={(e) => { e.preventDefault(); setRenamingId(p.id); }}
              title="Right-click to rename"
              className={cn(
                "px-4 py-2.5 text-xs rounded-xl transition-all duration-300 text-left flex items-center gap-3 group border",
                activeTab === 'playlist' && activePlaylistId === p.id
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm shadow-primary/5"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border-transparent"
              )}
            >
              <Music size={13} className={cn(
                "transition-colors",
                activeTab === 'playlist' && activePlaylistId === p.id ? "text-primary" : "text-slate-600 group-hover:text-slate-400"
              )} />
              <span className="font-bold truncate tracking-tight">{p.name}</span>
            </button>
          ))}
          {playlists.length === 0 && (
            <div className="px-3 py-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center border border-dashed border-white/5 rounded-2xl opacity-40">
               {t.playlist.empty}
            </div>
          )}
        </div>
      </div>

      <InputDialog
        isOpen={renamingId !== null}
        onClose={() => setRenamingId(null)}
        onSubmit={(newName: string) => renamingId && onRenamePlaylist(renamingId, newName)}
        title={t.common.rename}
        defaultValue={playlistToRename?.name}
        placeholder={t.search.placeholder}
      />

      {/* ── Footer Stats & Language */}
      <div className="border-t border-white/5 pt-5 flex flex-col gap-3 no-drag">
        {/* Streak indicator: subtle */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse" />
          <span className="text-slate-400 text-[11px] font-bold tracking-tight">Streak: {streak} days</span>
        </div>
        
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-2 py-1 text-slate-500 hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          <Languages size={14} />
          <span>{lang === 'en' ? 'English (US)' : 'Tiếng Việt'}</span>
        </button>
      </div>
    </aside>
  );
};

/* ────────────────────────────────────────────────────────────
   NAV ITEM
 ──────────────────────────────────────────────────────────── */
const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, active, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 w-full text-sm font-bold text-left group relative border overflow-hidden",
        active 
          ? "bg-white/5 text-white border-white/10 shadow-lg shadow-black/20" 
          : "text-slate-400 hover:text-white hover:bg-white/[0.03] border-transparent"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full shadow-[2px_0_12px_rgba(99,102,241,0.8)]" 
        />
      )}
      <div className={cn(
        "transition-all duration-500 shrink-0", 
        active ? "text-primary scale-110" : "text-slate-500 group-hover:text-slate-200 group-hover:scale-110"
      )}>
        {icon}
      </div>
      <span className={cn(
        "flex-1 tracking-tight transition-all duration-500",
        active ? "translate-x-0" : "group-hover:translate-x-1"
      )}>
        {label}
      </span>
      {badge != null && badge > 0 && (
        <span className="ml-auto text-[10px] font-black bg-white/[0.03] text-slate-400 px-2 py-0.5 rounded-lg border border-white/5 group-hover:bg-primary/10 group-hover:text-primary transition-all backdrop-blur-sm group-hover:border-primary/20">
          {badge}
        </span>
      )}
    </button>
  );
};
