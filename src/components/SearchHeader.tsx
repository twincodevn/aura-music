import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Bell, Sparkles, Clock, ArrowRight, Sunrise, Sun, CloudSun, Sunset, Moon, Target, Coffee, Flame, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Tab } from '../lib/constants';

interface SearchHeaderProps {
  activeTab: string;
  query: string;
  setQuery: (q: string) => void;
  onSearch: (filters?: { time: string; sort: string }) => void;
  onMoodSearch?: (query: string, filters?: { time: string; sort: string }) => void;
  onOpenChat?: () => void;
  onClear?: () => void;
  setActiveTab: (tab: Tab) => void;
}

function getGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h >= 5 && h < 9)  return { icon: <Sunrise size={18} />, text: 'Good morning' };
  if (h >= 9 && h < 12) return { icon: <Sun size={18} />, text: 'Mid-morning vibes' };
  if (h >= 12 && h < 14) return { icon: <CloudSun size={18} />, text: 'Lunch break' };
  if (h >= 14 && h < 18) return { icon: <Target size={18} />, text: 'Afternoon focus' };
  if (h >= 18 && h < 21) return { icon: <Sunset size={18} />, text: 'Evening unwind' };
  if (h >= 21 && h < 24) return { icon: <Moon size={18} />, text: 'Late night beats' };
  return { icon: <Moon size={18} className="opacity-60" />, text: 'Midnight oil' };
}

function getDynamicMoods(): { icon: React.ReactNode; label: string; query: string }[] {
  const h = new Date().getHours();
  // Morning: Coffee & Acoustic
  if (h >= 5 && h < 11) {
    return [
      { icon: <Coffee size={14} />, label: 'Morning Coffee', query: 'nhạc cafe sáng acoustic việt nam 2026' },
      { icon: <Sunrise size={14} />, label: 'Acoustic', query: 'acoustic vpop nhẹ nhàng 2026' },
      { icon: <Target size={14} />, label: 'Focus', query: 'lofi study beats no lyrics' },
    ];
  }
  // Afternoon: Focus & Energy
  if (h >= 11 && h < 18) {
    return [
      { icon: <Target size={14} />, label: 'Deep Focus', query: 'coding music dark lofi 2026' },
      { icon: <Flame size={14} />, label: 'Energy', query: 'nhạc trẻ remix sôi động 2026' },
      { icon: <Sun size={14} />, label: 'Chill', query: 'nhạc chill vpop 2026' },
    ];
  }
  // Evening: Relax & Unwind
  if (h >= 18 && h < 22) {
    return [
      { icon: <Sunset size={14} />, label: 'Unwind', query: 'nhạc lofi chill buồn nhẹ nhàng 2026' },
      { icon: <Moon size={14} />, label: 'Relax', query: 'jazz piano cafe relaxing 2026' },
      { icon: <Target size={14} />, label: 'Reading', query: 'nhạc đọc sách không lời 2026' },
    ];
  }
  // Late Night: Sleep & Deep Lo-fi
  return [
    { icon: <Moon size={14} />, label: 'Sleep', query: 'nhạc ngủ ngon 432hz sâu' },
    { icon: <CloudSun size={14} />, label: 'Deep Lo-Fi', query: 'midnight lofi hip hop' },
    { icon: <Sparkles size={14} />, label: 'Ambient', query: 'ambient sleep sounds rain' },
  ];
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  activeTab,
  query,
  setQuery,
  onSearch,
  onMoodSearch,
  onOpenChat,
  onClear,
  setActiveTab,
}) => {
  // Removed unused t
  const [isFocused, setIsFocused] = useState(false);
  const [greeting] = useState(getGreeting);
  const [quickMoods] = useState(getDynamicMoods);
  const inputRef = useRef<HTMLInputElement>(null);

  const [timeFilter, setTimeFilter] = useState('any');
  const [sortFilter, setSortFilter] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>(() => {
    try { 
      const raw = localStorage.getItem('searchHistory') || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(t => !t.includes('\uFFFD')) : [];
    } 
    catch { return []; }
  });

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const saveToHistory = (term: string) => {
    if (!term.trim() || term.includes('\uFFFD')) return;
    setHistory(prev => {
      const updated = [term.trim(), ...prev.filter(t => t.toLowerCase() !== term.trim().toLowerCase())].slice(0, 5);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleMoodClick = useCallback((q: string) => {
    setQuery(q);
    saveToHistory(q);
    onMoodSearch?.(q, { time: timeFilter, sort: sortFilter });
  }, [setQuery, onMoodSearch, timeFilter, sortFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveToHistory(query);
    inputRef.current?.blur();
    onSearch({ time: timeFilter, sort: sortFilter });
  };

  const handleSelectSuggestion = (text: string) => {
    setQuery(text);
    saveToHistory(text);
    inputRef.current?.blur();
    onMoodSearch?.(text, { time: timeFilter, sort: sortFilter });
  };

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const results = await window.ipcRenderer.invoke('getSearchSuggestions', query);
        setSuggestions(results);
      } catch (e) {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in any input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        if (activeTab !== 'search') setActiveTab('search');
        // Small delay to allow tab render before focusing
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') inputRef.current?.blur();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className={cn(
      "shrink-0 z-40 px-[var(--spacing-fluid)] border-b border-white/5 relative transition-all duration-700 bg-gradient-to-b from-[#06080a] to-transparent",
      activeTab === 'search' ? "pt-10 lg:pt-12 pb-6 lg:pb-8 flex flex-col gap-6 lg:gap-8" : "pt-6 pb-2 lg:pb-4 flex items-center justify-between"
    )}>
      <div className="flex items-center justify-between flex-1">
        <div className="flex flex-col gap-0.5">
          <h2 className={cn(
            "premium-title flex items-center gap-3 transition-all",
            activeTab === 'search' ? "text-2xl lg:text-4xl" : "text-xl lg:text-2xl"
          )}>
            <span className="text-primary animate-pulse-slow">{greeting.icon}</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tight">{greeting.text}</span>
          </h2>
          {activeTab === 'search' && (
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-11 opacity-40">Aura Intelligent Engine</p>
          )}
        </div>

        {activeTab !== 'search' && (
          <div className="flex items-center gap-4 shrink-0 no-drag ml-auto">
            <button 
              title="Notifications (coming soon)"
              className="p-2 lg:p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 text-slate-400 hover:text-white transition-all relative group shadow-sm opacity-40 cursor-not-allowed"
            >
              <Bell size={16} className="group-hover:rotate-12 transition-transform" />
            </button>
            
            <button 
              onClick={onOpenChat}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] group cursor-pointer hover:bg-primary/20 hover:border-primary/40 transition-all active:scale-95"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[9px] font-black text-white shadow-lg">
                AI
              </div>
              <Sparkles size={12} className="text-primary animate-pulse" />
            </button>
          </div>
        )}
      </div>

      {activeTab === 'search' && (
        <div className="flex items-center gap-4 shrink-0 no-drag">
          <button 
            title="Notifications (coming soon)"
            className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 text-slate-400 hover:text-white transition-all relative group shadow-sm opacity-40 cursor-not-allowed"
          >
            <Bell size={18} className="group-hover:rotate-12 transition-transform" />
          </button>
          
          <button 
            onClick={onOpenChat}
            className="flex items-center gap-3 pl-3 pr-2 py-2 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] group cursor-pointer hover:bg-primary/20 hover:border-primary/40 transition-all active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
              AI
            </div>
            <Sparkles size={14} className="text-primary animate-pulse" />
          </button>
        </div>
      )}

      {activeTab === 'search' && (
        <>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <form onSubmit={handleSubmit} className="relative flex-1 group no-drag">
              <Search className={cn(
                "absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-500",
                isFocused ? "text-primary scale-110" : "text-slate-600"
              )} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for tracks, artists, or vibes..."
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full h-11 lg:h-13 bg-white/[0.03] backdrop-blur-2xl hover:bg-white/[0.06] focus:bg-white/10 rounded-[24px] pl-12 pr-16 text-sm font-bold focus:outline-none transition-all duration-500 placeholder:text-slate-500 text-white border border-white/10 focus:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                {query && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuery('');
                      onClear?.();
                    }}
                    className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all no-drag"
                  >
                    <X size={14} />
                  </button>
                )}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md opacity-40">
                   <span className="text-[9px] font-black text-white italic tracking-widest">
                     {isFocused ? 'ESC' : '/'}
                   </span>
                </div>
              </div>
              
              <AnimatePresence>
                {isFocused && (query.trim() ? suggestions.length > 0 : history.length > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-3 glass border border-white/10 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] py-4 z-50 overflow-hidden"
                  >
                    {!query.trim() && history.length > 0 && (
                      <div className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-between mb-2">
                        <span>Recent Searches</span>
                        <button onMouseDown={clearHistory} className="hover:text-primary transition-colors hover:underline">Clear All</button>
                      </div>
                    )}
                    
                    {(query.trim() ? suggestions : history).map((item, i) => (
                      <div 
                        key={i}
                        onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(item); }}
                        className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.04] cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-4 text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                          <Clock size={16} className="opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all" />
                          {item}
                        </div>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-40 transition-all -translate-x-3 group-hover:translate-x-0 text-primary" />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="flex items-center gap-2 no-drag">
              {quickMoods.map((mood: { label: string; query: string; icon: React.ReactNode }) => (
                <button
                  key={mood.label}
                  onClick={() => handleMoodClick(mood.query)}
                  className={cn(
                    "px-4 lg:px-5 h-9 lg:h-11 rounded-2xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest border transition-all duration-500 flex items-center gap-2 lg:gap-3 shadow-md active:scale-95 group",
                    query === mood.query 
                      ? "bg-primary text-white border-primary/40 shadow-primary/20" 
                      : "bg-white/[0.03] text-slate-500 hover:text-white border-white/5 hover:bg-white/[0.08] hover:border-white/10"
                  )}
                >
                  <span className={cn(
                    "transition-all duration-500 scale-110 opacity-40 group-hover:opacity-100 group-hover:text-primary",
                    query === mood.query && "opacity-100 text-primary"
                  )}>{mood.icon}</span>
                  <span className="opacity-80 group-hover:opacity-100">{mood.label}</span>
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center rounded-2xl border transition-all duration-500 active:scale-90",
                  showFilters 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 rotate-45" 
                    : "bg-white/[0.03] text-slate-500 hover:text-white border-white/5 hover:bg-white/[0.08] hover:border-white/10"
                )}
              >
                <Sparkles size={18} />
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, margin: 0 }}
                animate={{ opacity: 1, height: 'auto', margin: '8px 0 0 0' }}
                exit={{ opacity: 0, height: 0, margin: 0 }}
                className="flex gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 shadow-inner overflow-hidden no-drag"
              >
                <FilterSelect label="Time Period" value={timeFilter} onChange={setTimeFilter} options={[
                  { value: 'any', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'year', label: 'This Year' }
                ]} />
                <FilterSelect label="Sort By" value={sortFilter} onChange={setSortFilter} options={[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'views', label: 'View Count' },
                  { value: 'date', label: 'Upload Date' }
                ]} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </header>
  );
};

const FilterSelect: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-2 flex-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);
