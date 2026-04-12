import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from './hooks/useLanguage';
import { Sidebar } from './components/Sidebar'
import { SearchHeader } from './components/SearchHeader'
import { TrackCard } from './components/TrackCard'
import { PlaylistCard } from './components/PlaylistCard'
import { TrackRow } from './components/TrackRow'
import { PlayerBar } from './components/PlayerBar'
import { QueuePanel } from './components/QueuePanel'
import { EqPanel } from './components/EqPanel'
import { LyricsPanel } from './components/LyricsPanel'
import { Toast } from './components/Toast'
import { PlaylistModal } from './components/PlaylistModal'
import { MiniPlayer } from './components/MiniPlayer'
import { StatsWrapped } from './components/StatsWrapped'
import { ImportModal } from './components/ImportModal'
import { VibeEngine } from './components/VibeEngine'
import { AuraChat } from './components/AuraChat'
import { LazyMode } from './components/LazyMode'
import { SkeletonGrid } from './components/SkeletonCard'
import { PodcastEngine } from './components/PodcastEngine'
import { cn, parseDuration, formatDuration, getTrackCategory } from './lib/utils';
import { useAudio } from './hooks/useAudio'
import useSleepTimer from './hooks/useSleepTimer'
import type { Track, Tab, Playlist } from './lib/constants'
import { EDITORIAL_PLAYLISTS } from './lib/constants'
import { Trash2, Share2, DownloadCloud, Music2, RefreshCw, ChevronRight, ListPlus } from 'lucide-react'
import { InputDialog } from './components/InputDialog'
import { ConfirmDialog } from './components/ConfirmDialog'
import { extractDominantColor } from './lib/colorUtils'
import { apiInvoke, apiSend } from './lib/api'

// API POLYFILL FOR WEB BROWSER
if (typeof window !== 'undefined' && !window.ipcRenderer) {
  window.ipcRenderer = {
    invoke: apiInvoke,
    send: apiSend,
    on: () => {},
    once: () => {},
    removeListener: () => {}
  } as any;
}
function applyAmbientColor(colors: { primary: string; secondary: string } | null) {
  if (!colors) return;
  const root = document.documentElement;
  root.style.setProperty('--ambient-primary', colors.primary);
  root.style.setProperty('--ambient-secondary', colors.secondary);
}

function App() {
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [trending, setTrending] = useState<Track[]>([])
  const [history, setHistory] = useState<Track[]>([])
  const [discoveryContext, setDiscoveryContext] = useState<{ moodLabel: string; seedChannel: string } | null>(null)
  const [liked, setLiked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('likedTracks') || '[]')); }
    catch { return new Set(); }
  })
  const [queue, setQueue] = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem('aura_queue') || '[]'); }
    catch { return []; }
  })
  
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [activePlaylistId, setActivePlaylistId] = useState<number | null>(null)
  const [stats, setStats] = useState<{ totalMinutes: number; totalTracks: number }>({ totalMinutes: 0, totalTracks: 0 })
  
  const totalXP = (stats.totalMinutes * 12) + (stats.totalTracks * 5)
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false)
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null)
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);

  const [showQueue, setShowQueue] = useState(false)
  const [showEq, setShowEq] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string;
    onConfirm: () => void; variant?: 'danger' | 'default';
    confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  const showConfirm = useCallback((opts: { title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'default'; confirmLabel?: string }) => {
    setConfirmDialog({ isOpen: true, ...opts });
  }, [])
  const { lang, t } = useLanguage()

  // Lyrics state
  const [lyricsLines, setLyricsLines] = useState<{time: number; text: string}[]>([])
  const [lyricsSynced, setLyricsSynced] = useState(false)
  const [lyricsSource, setLyricsSource] = useState<'official' | 'youtube' | 'none'>('none')
  const [lyricsLoading, setLyricsLoading] = useState(false)

  // Offline / Cached tracks state
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set())
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([])

  // Toast state
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<any>('info')
  const [showToast, setShowToast] = useState(false)
  const dismissToast = useCallback(() => setShowToast(false), [])
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [userAvatar, setUserAvatar] = useState<string | null>(localStorage.getItem('aura_avatar'))
  const [playerBarBg, setPlayerBarBg] = useState<string | null>(localStorage.getItem('aura_player_bg'))
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'songs' | 'mixes'>('all')


  const isMini = useMemo(() => new URLSearchParams(window.location.search).get('mini') === 'true', [])
  const onNextRef = useRef<() => void>(undefined);
  const audio = useAudio(useCallback(() => onNextRef.current?.(), []));

  // Sleep Timer
  const sleepTimer = useSleepTimer(useCallback(() => {
    if (audio.audioRef.current) {
      audio.audioRef.current.pause();
    }
  }, [audio.audioRef]));

  // Initial Data: Aura 6.0 Live Trending Discovery
  useEffect(() => {
    console.log('[Aura] Loading Live Charts...');
    window.ipcRenderer.invoke('getTrendingCharts').then((tracks: Track[]) => {
      if (tracks && tracks.length > 0) {
        setTrending(tracks.slice(0, 40));
      } else {
        // Ultimate Fallback: search for top V-Pop hits 2026
        window.ipcRenderer.invoke('searchMusic', 'V-Pop Hits 2026 Mới Nhất').then((t: Track[]) => {
          setTrending(t || []);
        });
      }
    }).catch(err => {
      console.error('Aura Live Charts failed', err);
      setToastMsg('Không thể tải Trending Charts. Kiểm tra kết nối mạng.');
      setToastType('error');
      setShowToast(true);
    });
    
    // Load History from DB (Smart Playlist fallback)
    window.ipcRenderer.invoke('getSmartPlaylist', 'focus').then((tracks: Track[]) => {
      if (tracks && tracks.length > 0) setHistory(tracks)
    }).catch(() => {})
    
    // Load Playlists
    window.ipcRenderer.invoke('getPlaylists').then(setPlaylists);
    window.ipcRenderer.invoke('getCachedTracks').then(setOfflineTracks);
  }, [lang]);


  // Removed handleDownloadTrack

  const handleClearCache = () => {
    showConfirm({
      title: 'Xóa bộ nhớ đệm',
      message: 'Bạn có chắc chắn muốn xóa tất cả nhạc đã tải về để giải phóng bộ nhớ?',
      variant: 'danger',
      confirmLabel: 'Xóa tất cả',
      onConfirm: async () => {
        try {
          const success = await window.ipcRenderer.invoke('clearMusicCache');
          if (success) {
            setCachedIds(new Set());
            setOfflineTracks([]);
            setToastMsg('Đã xóa sạch bộ nhớ nhạc!');
            setToastType('success');
            setShowToast(true);
          }
        } catch (err) {
          console.error('Clear cache failed:', err);
        }
      }
    });
  };

  const fetchStats = useCallback(async () => {
    try {
      const s = await window.ipcRenderer.invoke('getListeningStats')
      setStats({ totalMinutes: s.totalMinutes, totalTracks: s.totalTracks })
    } catch (e) {}
  }, [])

  const refreshCachedIds = useCallback(async () => {
    try {
      const ids = await window.ipcRenderer.invoke('getCachedIds');
      const tracks = await window.ipcRenderer.invoke('getCachedTracks');
      setCachedIds(new Set(ids));
      setOfflineTracks(tracks);
      fetchStats(); // Update stats when cache refreshes too
    } catch (err) {
      console.error('Failed to refresh cached IDs', err);
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);


  const handleDownload = useCallback(async (track: Track) => {
    if (downloadingIds.has(track.id) || cachedIds.has(track.id)) return;
    
    setDownloadingIds(prev => new Set(prev).add(track.id));
    setToastMsg(`${t.player.downloading}: ${track.title}`);
    setToastType('loading');
    setShowToast(true);

    try {
      const success = await window.ipcRenderer.invoke('downloadTrack', track.id, track);
      if (success) {
        setToastMsg(`${t.player.downloaded}: ${track.title}`);
        setToastType('success');
        setShowToast(true);
        refreshCachedIds();
      }
    } catch (err) {
      setToastMsg(t.common.error);
      setToastType('error');
      setShowToast(true);
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  }, [downloadingIds, cachedIds, t, refreshCachedIds]);

  const handleDownloadAll = useCallback(async (tracks: Track[]) => {
    const toDownload = tracks.filter(t => !cachedIds.has(t.id) && !downloadingIds.has(t.id));
    if (toDownload.length === 0) return;

    setToastMsg(`Syncing ${toDownload.length} tracks...`);
    setToastType('loading');
    setShowToast(true);

    // Process sequentially to avoid overwhelming the system
    for (const track of toDownload) {
      await handleDownload(track);
    }
  }, [cachedIds, downloadingIds, handleDownload]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowChat(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommand = (query: string) => {
    handleSearch(query, false);
    setActiveTab('search');
  };

  // Fetch lyrics when current track changes
  useEffect(() => {
    if (!audio.currentTrack) {
      setLyricsLines([])
      setLyricsSynced(false)
      return
    }
    const track = audio.currentTrack
    setLyricsLoading(true)
    setLyricsLines([])
    setLyricsSynced(false)

    const durSecs = parseDuration(track.duration)
    window.ipcRenderer.invoke('fetchLyrics', track.title, track.channel, durSecs > 0 ? durSecs : undefined, track.id)
      .then((result: { synced: boolean; source?: 'official' | 'youtube' | 'none'; lines: {time: number; text: string}[] }) => {
        setLyricsLines(result.lines)
        setLyricsSynced(result.synced)
        setLyricsSource(result.source || 'none')
      })
      .catch(() => {
        setLyricsLines([])
        setLyricsSynced(false)
      })
      .finally(() => setLyricsLoading(false))

    // Refresh stats when track changes (new track = previous track's listen data got logged)
    fetchStats();
  }, [audio.currentTrack?.id])
  
  const handleManualLyricsSearch = async (q: string) => {
    if (!q.trim()) return;
    setLyricsLoading(true);
    try {
      const result = await window.ipcRenderer.invoke('fetchLyrics', q, '', undefined);
      setLyricsLines(result.lines);
      setLyricsSynced(result.synced);
    } catch {
      setLyricsLines([]);
    } finally {
      setLyricsLoading(false);
    }
  };

  const handlePlaylistClick = async (id: number) => {
    setActivePlaylistId(id)
    setActiveTab('library')
    const tracks = await window.ipcRenderer.invoke('getPlaylistTracks', id)
    setPlaylistTracks(tracks)
  }

  const triggerCreatePlaylist = () => setIsCreatingPlaylist(true)

  const handleCreatePlaylist = async (name: string) => {
    if (name.trim()) {
      await window.ipcRenderer.invoke('createPlaylist', name.trim())
      const updated = await window.ipcRenderer.invoke('getPlaylists')
      setPlaylists(updated)
      setIsCreatingPlaylist(false)
    }
  }

  const handleCreateLikedPlaylist = async () => {
    const allTracks = [...offlineTracks, ...history];
    const map = new Map<string, Track>();
    
    for (const t of allTracks) {
      if (liked.has(t.id) && !map.has(t.id)) {
        map.set(t.id, t);
      }
    }
    
    const likedTrackObjects = Array.from(map.values());
    if (likedTrackObjects.length === 0) {
      setToastMsg('Bạn chưa có bài hát yêu thích nào!');
      setShowToast(true);
      return;
    }

    const name = `Mix Yêu Thích 💛`;
    const playlistId = await window.ipcRenderer.invoke('createPlaylist', name);
    
    for (const track of likedTrackObjects) {
      await window.ipcRenderer.invoke('addTrackToPlaylist', playlistId, track);
    }
    
    const updated = await window.ipcRenderer.invoke('getPlaylists');
    setPlaylists(updated);
    
    setToastMsg(`Đã auto-mix Playlist với ${likedTrackObjects.length} bài yêu thích!`);
    setShowToast(true);
    
    setActivePlaylistId(playlistId);
    setActiveTab('playlist');
    const tracks = await window.ipcRenderer.invoke('getPlaylistTracks', playlistId);
    setPlaylistTracks(tracks);
  };

  const handleSaveAsPlaylist = () => {
    if (results.length === 0) return;
    setIsSavingPlaylist(true);
  };

  const handleSavePlaylistConfirm = async (name: string) => {
    if (!name.trim()) return;
    setIsSavingPlaylist(false);
    try {
      setIsSearching(true);
      const playlistId = await window.ipcRenderer.invoke('createPlaylist', name.trim());
      
      for (const track of results) {
        await window.ipcRenderer.invoke('addTrackToPlaylist', playlistId, track);
      }
      
      const updated = await window.ipcRenderer.invoke('getPlaylists');
      setPlaylists(updated);
      
      setToastMsg(`Đã lưu "${name}" với ${results.length} bài hát!`);
      setShowToast(true);
      
      // Navigate to the new playlist
      setActivePlaylistId(playlistId);
      setActiveTab('playlist');
      const tracks = await window.ipcRenderer.invoke('getPlaylistTracks', playlistId);
      setPlaylistTracks(tracks);
    } catch (err) {
      console.error('Failed to save quick playlist:', err);
      setToastMsg('Không thể lưu playlist nhanh.');
      setShowToast(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToPlaylist = (track: Track) => {
    setPlaylistModalTrack(track)
    setIsPlaylistModalOpen(true)
  }

  const handleRenamePlaylist = async (id: number, newName: string) => {
    await window.ipcRenderer.invoke('renamePlaylist', id, newName)
    const updatedPlaylists = await window.ipcRenderer.invoke('getPlaylists')
    setPlaylists(updatedPlaylists)
  }

  const handleExportPlaylist = async () => {
    try {
      if (playlistTracks.length === 0) {
        setToastMsg('Playlist is empty!');
        setShowToast(true);
        return;
      }
      const json = JSON.stringify(playlistTracks);
      const base64 = btoa(unescape(encodeURIComponent(json)));
      await navigator.clipboard.writeText(base64);
      setToastMsg('Playlist code copied to clipboard!');
      setShowToast(true);
    } catch {
      setToastMsg('Failed to export playlist.');
      setShowToast(true);
    }
  }

  const handleImportPlaylist = async (code: string) => {
    setIsImportModalOpen(false);
    try {
      const json = decodeURIComponent(escape(atob(code)));
      const tracks: Track[] = JSON.parse(json);
      if (!Array.isArray(tracks) || tracks.length === 0) throw new Error('Invalid base-code');
      if (!activePlaylistId) return;
      
      let added = 0;
      for (const track of tracks) {
        await window.ipcRenderer.invoke('addTrackToPlaylist', activePlaylistId, track);
        added++;
      }
      
      const newTracks = await window.ipcRenderer.invoke('getPlaylistTracks', activePlaylistId);
      setPlaylistTracks(newTracks);
      setToastMsg(`Imported ${added} tracks successfully!`);
      setShowToast(true);
    } catch {
      setToastMsg('Invalid playlist code.');
      setShowToast(true);
    }
  }

  const handleConfirmAdd = async (playlistId: number) => {
    if (playlistModalTrack) {
      await window.ipcRenderer.invoke('addTrackToPlaylist', playlistId, playlistModalTrack)
      // Refresh if we are viewing the playlist
      if (activePlaylistId === playlistId) {
        const tracks = await window.ipcRenderer.invoke('getPlaylistTracks', playlistId)
        setPlaylistTracks(tracks)
      }
    }
  }

  const handleCreateAndAdd = async (name: string) => {
    if (playlistModalTrack) {
      const id = await window.ipcRenderer.invoke('createPlaylist', name)
      await window.ipcRenderer.invoke('addTrackToPlaylist', id, playlistModalTrack)
      const updated = await window.ipcRenderer.invoke('getPlaylists')
      setPlaylists(updated)
      if (activePlaylistId === id) {
        const tracks = await window.ipcRenderer.invoke('getPlaylistTracks', id)
        setPlaylistTracks(tracks)
      }
    }
  }

  const handleDeletePlaylist = (id: number) => {
    showConfirm({
      title: 'Xóa playlist',
      message: t.playlist.deleteConfirm,
      variant: 'danger',
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        await window.ipcRenderer.invoke('deletePlaylist', id)
        const updated = await window.ipcRenderer.invoke('getPlaylists')
        setPlaylists(updated)
        if (activePlaylistId === id) {
          setActiveTab('home')
          setActivePlaylistId(null)
        }
      }
    });
  }

  const handleRemoveTrack = async (videoId: string) => {
    if (activeTab === 'library') {
      const ok = await window.ipcRenderer.invoke('deleteCachedTrack', videoId);
      if (ok) {
        setOfflineTracks(prev => prev.filter(t => t.id !== videoId));
        setCachedIds(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      }
      return;
    }

    if (activePlaylistId) {
      await window.ipcRenderer.invoke('removeTrackFromPlaylist', activePlaylistId, videoId);
      setPlaylistTracks(prev => prev.filter(t => t.id !== videoId));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTracks.size === 0) return;
    showConfirm({
      title: 'Xóa bài hát đã chọn',
      message: `Bạn có chắc chắn muốn xóa ${selectedTracks.size} bài hát khỏi ổ đĩa?`,
      variant: 'danger',
      confirmLabel: `Xóa ${selectedTracks.size} bài`,
      onConfirm: async () => {
        for (const id of selectedTracks) {
          await window.ipcRenderer.invoke('deleteCachedTrack', id);
        }
        setOfflineTracks(prev => prev.filter(t => !selectedTracks.has(t.id)));
        setCachedIds(prev => {
          const next = new Set(prev);
          selectedTracks.forEach(id => next.delete(id));
          return next;
        });
        setSelectedTracks(new Set());
        setIsSelectionMode(false);
      }
    });
  };

  const handleSearch = useCallback(async (
    q: string, 
    isTrending = false, 
    filters?: { time: string; sort: string }
  ) => {
    if (!q.trim()) return
    setIsSearching(true)
    if (!isTrending) setActiveTab('search')
    // Clear discovery context if user is doing a manual search
    if (!isTrending) setDiscoveryContext(null)
    
    try {
      let tracks: Track[];
      if (filters && (filters.time !== 'any' || filters.sort !== 'relevance')) {
        tracks = await window.ipcRenderer.invoke('searchAdvancedMusic', q, filters)
      } else {
        tracks = await window.ipcRenderer.invoke('searchMusic', q)
      }

      // Aura 5.3: Song-First Filtering for Trending Content
      // Purge 1-9 hour lofi mixes/loops to prioritize actual hits (V-Pop, Global Hits)
      if (isTrending && tracks) {
        tracks = tracks.filter(t => {
          const parts = t.duration.split(':');
          const isTooLong = parts.length > 2 || parseInt(parts[0]) > 12; // 12 mins threshold
          const isLofiMix = t.title.toLowerCase().includes('lofi mix') || 
                          t.title.toLowerCase().includes('cafe music') ||
                          t.title.toLowerCase().includes('study beats');
          return !isTooLong && !isLofiMix;
        });
      }

      if (isTrending) setTrending(tracks)
      else setResults(tracks)
    } catch {
      if (!isTrending) setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const fetchDiscoveryMix = useCallback(async () => {
    setIsSearching(true)
    setActiveTab('search')
    setQuery('') // clear manual search query
    try {
      const data = await window.ipcRenderer.invoke('getDynamicDiscoveryMix')
      if (data) {
        setDiscoveryContext({ moodLabel: data.moodLabel, seedChannel: data.seedChannel })
        setResults(data.tracks || [])
      }
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handlePlay = useCallback((track: Track, context?: Track[]) => {
    if (!track || !track.id) return
    audio.playTrack(track)
    // Add to history if not exists
    setHistory(prev => {
       const existing = prev.find(t => t.id === track.id)
       if (existing) return [track, ...prev.filter(t => t.id !== track.id)].slice(0, 20)
       return [track, ...prev].slice(0, 20)
    })
    
    if (context) {
      setQueue(context)
    } else {
      setQueue(prev => prev.find(t => t.id === track.id) ? prev : [...prev, track])
    }

    // Refresh cached IDs + stats after a short delay
    setTimeout(() => { refreshCachedIds(); fetchStats(); }, 3000)
  }, [audio, refreshCachedIds, fetchStats])

  // Share handler — use real YouTube URL
  const handleShare = useCallback(() => {
    if (!audio.currentTrack) return
    const text = `https://youtu.be/${audio.currentTrack.id}`
    navigator.clipboard.writeText(text).then(() => {
      setToastMsg(`${t.player.copied}: ${audio.currentTrack!.title}`)
      setToastType('success')
      setShowToast(true)
    }).catch(() => {
      setToastMsg("Could not copy link")
      setToastType('error')
      setShowToast(true)
    })
  }, [audio.currentTrack, t])

  const handleAvatarUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setUserAvatar(base64);
      localStorage.setItem('aura_avatar', base64);
      setToastMsg("Avatar updated!");
      setToastType('success');
      setShowToast(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleBgUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPlayerBarBg(base64);
      localStorage.setItem('aura_player_bg', base64);
      setToastMsg("PlayerBar background updated!");
      setToastType('success');
      setShowToast(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleResetCustomization = useCallback(() => {
    setUserAvatar(null);
    setPlayerBarBg(null);
    localStorage.removeItem('aura_avatar');
    localStorage.removeItem('aura_player_bg');
    setToastMsg("Preferences reset");
    setToastType('info');
    setShowToast(true);
  }, []);

  // Sync on mount
  useEffect(() => {
    refreshCachedIds();
  }, [refreshCachedIds]);

  const toggleLike = (track: Track) => {
    setLiked(prev => {
      const next = new Set(prev)
      if (next.has(track.id)) next.delete(track.id)
      else next.add(track.id)
      localStorage.setItem('likedTracks', JSON.stringify([...next]))
      return next
    })
  }

  const onNext = useCallback(async () => {
    // Repeat One: replay current track
    if (audio.repeat === 'one' && audio.currentTrack) {
      audio.playTrack(audio.currentTrack);
      return;
    }
    const idx = queue.findIndex(t => t.id === audio.currentTrack?.id);
    if (audio.shuffle && queue.length > 1) {
      // Shuffle: pick random track that isn't current
      let randIdx: number;
      do { randIdx = Math.floor(Math.random() * queue.length); } while (randIdx === idx && queue.length > 1);
      audio.playTrack(queue[randIdx]);
    } else if (idx !== -1 && idx < queue.length - 1) {
      audio.playTrack(queue[idx + 1]);
    } else if (audio.repeat === 'all' && queue.length > 0) {
      // Repeat All: loop back to start
      audio.playTrack(queue[0]);
    } else if (audio.currentTrack) {
      // Aura 3.0: Auto-Radio (Nghe nhạc vô tận)
      try {
        console.log('[Auto-Radio] Fetching related tracks for endless playback...');
        const related = await window.ipcRenderer.invoke('getRelatedTracks', audio.currentTrack.id);
        if (related && related.length > 0) {
          const nextTrack = related[0];
          setQueue(prev => {
            const nextQueue = [...prev, nextTrack];
            localStorage.setItem('aura_queue', JSON.stringify(nextQueue));
            return nextQueue;
          });
          audio.playTrack(nextTrack);
          return;
        }
      } catch (err) {
        console.error('[Auto-Radio] Failed to fetch related tracks', err);
      }
      
      // Smart Recommendation fallback
      if (trending.length > 0) {
        const randomTrack = trending[Math.floor(Math.random() * trending.length)];
        handlePlay(randomTrack, trending);
      }
    }
  }, [queue, audio, trending]);

  // Stable refs so IPC handlers don't re-register on every render
  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  const onPrevRef = useRef<(() => void) | undefined>(undefined);
  // Persist queue to localStorage so it survives app restarts
  useEffect(() => {
    try { localStorage.setItem('aura_queue', JSON.stringify(queue.slice(0, 50))); } catch {}
  }, [queue]);


  const onPrev = useCallback(() => {
    const idx = queue.findIndex(t => t.id === audio.currentTrack?.id)
    if (idx > 0) {
      audio.playTrack(queue[idx-1])
    } else if (audio.audioRef.current) {
      audio.audioRef.current.currentTime = 0
    }
  }, [queue, audio])

  useEffect(() => { onPrevRef.current = onPrev; }, [onPrev]);

  // IPC Sync & Global Shortcut Handlers — registered ONCE via refs to avoid listener leaks
  useEffect(() => {
    const handleNext = () => { if (onNextRef.current) onNextRef.current(); };
    const handlePrev = () => { if (onPrevRef.current) onPrevRef.current(); };

    window.ipcRenderer.on('media-next', handleNext);
    window.ipcRenderer.on('media-prev', handlePrev);

    return () => {
      window.ipcRenderer.removeListener('media-next', handleNext);
      window.ipcRenderer.removeListener('media-prev', handlePrev);
    };
  }, []); // ← empty deps: register once

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          audio.togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          audio.setVolume(Math.min(1, audio.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          audio.setVolume(Math.max(0, audio.volume - 0.1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audio, onNext, onPrev]);

  const currentTrackIndex = queue.findIndex(t => t.id === audio.currentTrack?.id)
  // canNext: true if next track in queue, OR if auto-radio/shuffle/repeat can provide one
  const canNext = (currentTrackIndex !== -1 && currentTrackIndex < queue.length - 1) || audio.shuffle || audio.repeat !== 'off' || !!audio.currentTrack
  const canPrev = currentTrackIndex > 0

  if (isMini) {
    return (
      <MiniPlayer 
        currentTrack={audio.currentTrack}
        isPlaying={audio.isPlaying}
        progress={audio.progress}
        onTogglePlay={audio.togglePlayPause}
        onNext={onNext}
        onPrev={onPrev}
        onClose={() => (window as any).ipcRenderer.send('close-mini-player')}
        accentColor={audio.accentColor}
        isAlwaysOnTop={isAlwaysOnTop}
        onToggleTop={() => {
          const newVal = !isAlwaysOnTop;
          setIsAlwaysOnTop(newVal);
          (window as any).ipcRenderer.send('mini-player-set-top', newVal);
        }}
        analyserRef={audio.analyserRef}
      />
    );
  }

  // ── Ambient color system: extract from thumbnail when track changes
  useEffect(() => {
    if (!audio.currentTrack?.thumbnail) return;
    extractDominantColor(audio.currentTrack.thumbnail)
      .then(applyAmbientColor)
      .catch(() => {});
  }, [audio.currentTrack?.id]);

  return (
    <div className="flex h-screen bg-[#06080a] text-foreground overflow-hidden font-sans selection:bg-primary/20 border border-white/5 rounded-none md:rounded-3xl m-0 md:m-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
      {/* Ultra Premium Ambient Meshes */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen transition-opacity duration-1000 opacity-60">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[150px] opacity-[0.15] transition-colors duration-[4s] ease-in-out" style={{ backgroundColor: 'rgb(var(--ambient-primary))' }} />
        <div className="absolute top-[10%] -right-[15%] w-[65vw] h-[65vw] rounded-full blur-[160px] opacity-[0.1] transition-colors duration-[4s] ease-in-out" style={{ backgroundColor: 'rgb(var(--ambient-secondary))' }} />
        <div className="absolute -bottom-[20%] left-[15%] w-[70vw] h-[70vw] rounded-full blur-[180px] opacity-[0.12] transition-colors duration-[4s] ease-in-out" style={{ backgroundColor: 'rgb(var(--ambient-primary))' }} />
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentTrack={audio.currentTrack} 
        isPlaying={audio.isPlaying}
        onDynamicMixClick={fetchDiscoveryMix}
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onPlaylistClick={handlePlaylistClick}
        onRenamePlaylist={handleRenamePlaylist}
        onCreatePlaylist={triggerCreatePlaylist}
        cachedCount={cachedIds.size}
        onOpenStats={() => setIsStatsOpen(true)}
        xp={totalXP}
      />

      <AuraChat 
        show={showChat} 
        onClose={() => setShowChat(false)} 
        onCommand={handleCommand}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <SearchHeader 
          activeTab={activeTab}
          query={query} 
          setQuery={setQuery} 
          onSearch={(filters) => handleSearch(query, false, filters)} 
          onMoodSearch={(q, filters) => handleSearch(q, false, filters)}
          onOpenChat={() => setShowChat(true)}
          onClear={() => {
            setActiveTab('home');
            setResults([]);
          }}
          setActiveTab={setActiveTab}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.section
                key="home"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="px-[var(--spacing-fluid)] py-10 lg:py-12 pt-4 lg:pt-6"
              >
                <VibeEngine
                  trending={trending}
                  playHistory={history}
                  currentTrack={audio.currentTrack}
                  isPlaying={audio.isPlaying}
                  streamLoading={audio.streamLoading}
                  onPlay={handlePlay}
                  onSearch={(q) => handleSearch(q, false)}
                  onDynamicMix={fetchDiscoveryMix}
                >
                  {/* Aura Editorial Hub */}
                  <div className="flex flex-col gap-8 mb-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-primary rounded-full opacity-60 transition-all duration-700" style={{ backgroundColor: `rgb(${audio.accentColor})` }} />
                          <h3 className="text-xl premium-title uppercase tracking-tight aura-gold-gradient">Aura Editorial</h3>
                       </div>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2 scroll-smooth">
                      {EDITORIAL_PLAYLISTS.map(p => (
                        <PlaylistCard key={p.id} playlist={p} onClick={(q) => handleSearch(q, false)} />
                      ))}
                    </div>
                  </div>

                  {/* Recently Played & Mixes - Moved for better decluttering */}
                  {!query && !discoveryContext && (
                    <div className="mb-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-accent rounded-full opacity-60" />
                        <h3 className="text-xl premium-title uppercase tracking-tight">Vừa Nghe & Mix</h3>
                      </div>
                      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                         {history.length > 0 && (
                           <PlaylistCard 
                             playlist={{
                               id: 'recently-played',
                               label: 'Recently Played',
                               description: 'Your recent sound history.',
                               query: history.map(t => t.title).slice(0, 5).join(' '),
                               image: history[0]?.thumbnail || '',
                               color: 'from-slate-500/20 to-zinc-500/20'
                             }}
                             onClick={() => setResults(history)}
                           />
                         )}
                         <PlaylistCard 
                             playlist={{
                               id: 'discovery-mix',
                               label: 'Discovery Daily',
                               description: 'Fresh tracks picked by Aura.',
                               query: 'new music mix 2024 hits',
                               image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop',
                               color: 'from-primary/20 to-accent/20'
                             }}
                             onClick={fetchDiscoveryMix}
                         />
                      </div>
                    </div>
                  )}

                  {/* Trending Now */}
                  <div className="flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-amber-400 rounded-full opacity-60" />
                          <h3 className="text-xl premium-title uppercase tracking-tight flex items-center gap-3 aura-gold-gradient">
                            Trending Now
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[9px] font-black tracking-widest text-red-500 antialiased">LIVE</span>
                            </div>
                          </h3>
                       </div>
                       {!isSearching && trending.length > 0 && (
                          <button 
                            onClick={() => {
                              setResults(trending);
                              setQuery("Trending Now");
                              setActiveTab('search');
                            }} 
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2"
                          >
                             Full List <ChevronRight size={12} />
                          </button>
                       )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                      {isSearching ? <SkeletonGrid count={10} /> : trending.map((t, i) => (
                        <TrackCard
                          key={t.id}
                          track={t}
                          index={i}
                          isActive={audio.currentTrack?.id === t.id}
                          isPlaying={audio.isPlaying}
                          streamLoading={audio.streamLoading && audio.currentTrack?.id === t.id}
                          isLiked={liked.has(t.id)}
                          isCached={cachedIds.has(t.id)}
                          isDownloading={downloadingIds.has(t.id)}
                          onPlay={(t) => handlePlay(t, trending)}
                          onLike={toggleLike}
                          onDownload={handleDownload}
                          onAddToPlaylist={handleAddToPlaylist}
                        />
                      ))}
                    </div>
                  </div>
                </VibeEngine>
              </motion.section>
            )}

            {activeTab === 'search' && (
              <motion.section 
                key="search"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-6 md:p-10"
              >

                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-accent rounded-full opacity-60" />
                        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                          {discoveryContext ? "Mix Dành Cho Bạn" : (query ? `${t.search.resultsLabel}: ${query}` : t.sidebar.search)}
                        </h2>
                      </div>
                    {discoveryContext && (
                      <div className="flex items-center gap-2 pl-5 mt-2">
                        <span className="premium-subtitle">Generated from</span>
                        <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5">{discoveryContext.seedChannel}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleDownloadAll(results)}
                        className="px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-primary/20 flex items-center gap-2 h-9"
                        title="Download all tracks"
                      >
                        <DownloadCloud size={14} /> Sync All
                      </button>
                      <button 
                        onClick={handleSaveAsPlaylist}
                        className="px-4 py-2.5 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center gap-2 h-9"
                        title="Save this mix as a playlist"
                      >
                        <ListPlus size={14} /> Lưu Playlist
                      </button>
                      {discoveryContext && (
                        <button 
                          onClick={fetchDiscoveryMix}
                          disabled={isSearching}
                          className="px-4 py-2.5 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all border border-white/5 flex items-center gap-2 group/refresh h-9"
                        >
                          <RefreshCw size={13} className={cn("transition-transform duration-700", isSearching ? "animate-spin text-primary" : "group-hover/refresh:rotate-180")} /> 
                          {isSearching ? t.player.loading : "Regenerate Vibe"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {isSearching ? (
                    <SkeletonGrid count={10} />
                  ) : results.length > 0 ? (
                    results.map((t, i) => (
                      <TrackCard 
                        key={t.id} 
                        track={t} 
                        index={i} 
                        isActive={audio.currentTrack?.id === t.id} 
                        isPlaying={audio.isPlaying}
                        streamLoading={audio.streamLoading && audio.currentTrack?.id === t.id}
                        isLiked={liked.has(t.id)}
                        isCached={cachedIds.has(t.id)}
                        isDownloading={downloadingIds.has(t.id)}
                        onPlay={(t) => handlePlay(t, results)}
                        onLike={toggleLike}
                        onDownload={handleDownload}
                        onAddToPlaylist={handleAddToPlaylist}
                      />
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-6">
                       <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                         <Music2 size={32} className="text-slate-500" />
                       </div>
                       <div className="text-center">
                         <p className="font-bold text-lg text-slate-300 mb-1">Tìm kiếm nhạc</p>
                         <p className="text-sm text-slate-500">Nhập tên bài hát, nghệ sĩ, hoặc thử gợi ý bên dưới</p>
                       </div>
                       <div className="flex flex-wrap gap-2 justify-center max-w-md">
                         {[
                           { label: '🔥 Trending V-Pop', q: 'V-Pop hit mới nhất 2026' },
                           { label: '🎧 Lo-fi Study', q: 'lofi study beats chill' },
                           { label: '💃 Dance Remix', q: 'remix dance 2026 EDM' },
                           { label: '🌧️ Nhạc Buồn', q: 'nhạc buồn tâm trạng hay nhất' },
                           { label: '🎹 Piano Chill', q: 'piano relaxing instrumental' },
                         ].map(s => (
                           <button
                             key={s.q}
                             onClick={() => { setQuery(s.q); handleSearch(s.q, false); }}
                             className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-slate-300 hover:text-white transition-all"
                           >
                             {s.label}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {activeTab === 'podcast' && (
              <motion.section 
                key="podcast"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <PodcastEngine onSearch={(q) => handleSearch(q, false)} />
              </motion.section>
            )}

            {activeTab === 'library' && (
              <motion.section 
                key="library"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="px-[var(--spacing-fluid)] py-10 lg:py-12 pt-4 lg:pt-6"
              >
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-secondary rounded-full opacity-60" />
                    <h2 className="text-2xl lg:text-3xl premium-title">Thư viện của tôi</h2>
                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{offlineTracks.length} tracks</span>
                  </div>

                    <div className="flex items-center gap-3">
                      <div className="flex bg-white/5 rounded-full p-1 backdrop-blur-md border border-white/5 mr-2">
                        {(['all', 'songs', 'mixes'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setLibraryFilter(f)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                              libraryFilter === f 
                                ? "bg-white text-black shadow-md" 
                                : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                          >
                            {f === 'all' ? 'Tất cả' : f === 'songs' ? 'Bài hát' : 'Mixes'}
                          </button>
                        ))}
                      </div>

                      <div className="w-px h-4 bg-white/10" />

                      {isSelectionMode ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={handleDeleteSelected}
                            className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border border-red-500/20"
                          >
                            Xóa {selectedTracks.size}
                          </button>
                          <button 
                            onClick={() => {
                              setIsSelectionMode(false);
                              setSelectedTracks(new Set());
                            }}
                            className="px-3 py-1.5 text-slate-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={handleCreateLikedPlaylist}
                            className="px-3 py-1.5 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border border-white/10 flex items-center gap-2"
                          >
                            <Music2 size={12} className="text-pink-400" />
                            Auto Mix
                          </button>
                          <button 
                            onClick={() => setIsSelectionMode(true)}
                            className="px-3 py-1.5 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-widest transition-all"
                          >
                            Chọn nhiều
                          </button>
                          <button 
                            onClick={handleClearCache}
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                            title="Xóa tất cả"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                </div>

                {offlineTracks.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <div className="w-1 h-6 bg-emerald-500 rounded-full opacity-60" />
                      <h3 className="text-xl premium-title">Offline Library</h3>
                    </div>
                    <div className="space-y-1">
                      {offlineTracks.filter(tr => {
                        if (libraryFilter === 'all') return true;
                        const isMix = getTrackCategory(tr.duration) !== null;
                        return libraryFilter === 'songs' ? !isMix : isMix;
                      }).map((tr, i) => (
                        <TrackRow 
                          key={`dl-${tr.id}`} 
                          track={tr} 
                          index={i} 
                          isActive={audio.currentTrack?.id === tr.id} 
                          isPlaying={audio.isPlaying}
                          streamLoading={audio.streamLoading && audio.currentTrack?.id === tr.id}
                          isLiked={liked.has(tr.id)}
                          isCached={true}
                          isSelected={selectedTracks.has(tr.id)}
                          isSelectionMode={isSelectionMode}
                          onSelect={(id: string) => {
                            setSelectedTracks(prev => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                            });
                          }}
                          onPlay={(tr) => isSelectionMode ? null : handlePlay(tr, offlineTracks)}
                          onLike={toggleLike}
                          onRemove={handleRemoveTrack}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-1 h-6 bg-slate-500 rounded-full opacity-60" />
                    <h3 className="text-xl premium-title flex items-center justify-between flex-1">
                      <span>Phát Gần Đây</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{history.length} Bài</span>
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {history.length > 0 ? history.filter(tr => {
                      if (libraryFilter === 'all') return true;
                      const isMix = getTrackCategory(tr.duration) !== null;
                      return libraryFilter === 'songs' ? !isMix : isMix;
                    }).map((tr, i) => (
                      <TrackRow 
                        key={`hs-${tr.id}`} 
                        track={tr} 
                        index={i} 
                        isActive={audio.currentTrack?.id === tr.id} 
                        isPlaying={audio.isPlaying}
                        streamLoading={audio.streamLoading && audio.currentTrack?.id === tr.id}
                        isLiked={liked.has(tr.id)}
                        isCached={cachedIds.has(tr.id)}
                        onPlay={(tr) => handlePlay(tr, history)}
                        onLike={toggleLike}
                        onAddToPlaylist={handleAddToPlaylist}
                        onRemove={handleRemoveTrack}
                      />
                    )) : (
                      <div className="h-24 flex items-center justify-center glass rounded-2xl opacity-40">
                        {t.playlist.empty}
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === 'playlist' && activePlaylistId && (
              <motion.section 
                key={`playlist-${activePlaylistId}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="px-[var(--spacing-fluid)] py-10 lg:py-12 pt-4 lg:pt-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-primary rounded-full opacity-60" />
                    <h2 className="text-2xl lg:text-3xl premium-title">
                      {playlists.find(p => p.id === activePlaylistId)?.name || t.sidebar.playlists}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 opacity-60">
                      <span>{playlistTracks.length} tracks</span>
                      <span className="opacity-30">•</span>
                      <span>Total Time: {formatDuration(playlistTracks.reduce((acc, t) => acc + parseDuration(t.duration), 0))}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDownloadAll(playlistTracks)}
                      className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                      title="Download all tracks in this playlist"
                    >
                      <DownloadCloud size={16} /> Sync
                    </button>
                    <button 
                      onClick={() => setIsImportModalOpen(true)}
                      className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                      title="Import tracks using a shared code"
                    >
                      <DownloadCloud size={16} /> Import
                    </button>
                    <button 
                      onClick={handleExportPlaylist}
                      className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                      title="Share Playlist"
                    >
                      <Share2 size={16} /> Share
                    </button>
                    <button 
                      onClick={() => handleDeletePlaylist(activePlaylistId!)}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                      <Trash2 size={16} /> {t.common.delete}
                    </button>
                  </div>
                </div>

                <div className="space-y-1 max-w-4xl">
                   {playlistTracks.length > 0 ? playlistTracks.map((t, i) => (
                     <TrackRow 
                        key={`${activePlaylistId}-${t.id}`}
                        track={t} 
                        index={i} 
                        isActive={audio.currentTrack?.id === t.id} 
                        isPlaying={audio.isPlaying}
                        streamLoading={audio.streamLoading && audio.currentTrack?.id === t.id}
                        isLiked={liked.has(t.id)}
                        isCached={cachedIds.has(t.id)}
                        isDownloading={downloadingIds.has(t.id)}
                        onPlay={(t) => handlePlay(t, playlistTracks)}
                        onLike={toggleLike}
                        onDownload={handleDownload}
                        onAddToPlaylist={handleAddToPlaylist}
                        onRemove={handleRemoveTrack}
                      />
                   )) : (
                      <div className="h-60 flex flex-col items-center justify-center glass rounded-3xl border-2 border-dashed border-white/5 opacity-40">
                         <Music2 size={48} className="mb-4 text-slate-500" />
                         <p className="font-bold uppercase tracking-widest text-sm">{t.playlist.empty}</p>
                      </div>
                   )}
                </div>
              </motion.section>
            )}

          </AnimatePresence>
        </div>

        {/* Lazy Mode FAB — only on home tab */}
        {activeTab === 'home' && (
          <LazyMode onTrigger={fetchDiscoveryMix} isPlaying={audio.isPlaying} />
        )}

        <PlayerBar 
          currentTrack={audio.currentTrack}
          isPlaying={audio.isPlaying}
          streamLoading={audio.streamLoading}
          progress={audio.progress}
          currentTime={audio.currentTime}
          duration={audio.duration}
          volume={audio.volume}
          isLiked={liked.has(audio.currentTrack?.id || '')}
          showQueue={showQueue}
          showEq={showEq}
          showLyrics={showLyrics}
          userAvatar={userAvatar}
          playerBarBg={playerBarBg}
          onPlayPause={audio.togglePlayPause}
          onNext={onNext}
          onPrev={onPrev}
          canNext={canNext}
          canPrev={canPrev}
          onMiniPlayer={() => window.ipcRenderer.send('toggle-mini-player')}
          onSeek={audio.seekTo}
          onVolumeChange={(e) => audio.setVolume(Number(e.target.value))}
          onToggleLike={() => audio.currentTrack && toggleLike(audio.currentTrack)}
          onShare={handleShare}
          onToggleQueue={() => setShowQueue(!showQueue)}
          onToggleEq={() => { setShowEq(!showEq); if (!showEq) audio.initEq(); }}
          onToggleLyrics={() => setShowLyrics(!showLyrics)}
          onToggleMute={audio.toggleMute}
          onAvatarUpload={handleAvatarUpload}
          onBgUpload={handleBgUpload}
          onResetPersonalization={handleResetCustomization}
          shuffle={audio.shuffle}
          repeat={audio.repeat}
          onToggleShuffle={audio.toggleShuffle}
          onToggleRepeat={audio.toggleRepeat}
          sleepTimer={sleepTimer}
          analyserRef={audio.analyserRef}
          accentColor={audio.accentColor}
        />

        <QueuePanel 
          show={showQueue} 
          onClose={() => setShowQueue(false)}
          queue={queue}
          currentTrack={audio.currentTrack}
          onPlay={handlePlay}
          onRemove={(id) => setQueue(prev => prev.filter(t => t.id !== id))}
          onClear={() => setQueue([])}
          onReorder={setQueue}
        />

        <EqPanel 
          show={showEq}
          onClose={() => setShowEq(false)}
          eqPreset={audio.eqPreset}
          setEqPreset={audio.setEqPreset}
          eqBands={audio.eqBands}
          setEqBands={audio.setEqBands}
        />

        <LyricsPanel
          show={showLyrics}
          onClose={() => setShowLyrics(false)}
          lines={lyricsLines}
          synced={lyricsSynced}
          source={lyricsSource}
          loading={lyricsLoading}
          currentTime={audio.currentTimeRaw || 0}
          onManualSearch={handleManualLyricsSearch}
          thumbnail={audio.currentTrack?.thumbnail}
          onSeek={(time) => {
            if (audio.audioRef.current) {
              audio.audioRef.current.currentTime = time;
            }
          }}
          t={t}
        />

        <Toast
          message={toastMsg}
          show={showToast}
          type={toastType}
          onDismiss={dismissToast}
        />

        <PlaylistModal 
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          track={playlistModalTrack}
          playlists={playlists}
          onAddToPlaylist={handleConfirmAdd}
          onCreateAndAdd={handleCreateAndAdd}
        />

        <InputDialog
          isOpen={isCreatingPlaylist}
          onClose={() => setIsCreatingPlaylist(false)}
          onSubmit={handleCreatePlaylist}
          title={t.sidebar.newPlaylist}
          placeholder={t.search.placeholder}
        />

        <StatsWrapped 
          show={isStatsOpen} 
          onClose={() => setIsStatsOpen(false)} 
          onPlay={handlePlay} 
          analyserRef={audio.analyserRef}
          accentColor={audio.accentColor}
        />

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportPlaylist}
        />

        <InputDialog
          isOpen={isSavingPlaylist}
          onClose={() => setIsSavingPlaylist(false)}
          onSubmit={handleSavePlaylistConfirm}
          title={t.playlist.createNew}
          placeholder="Aura Mix - ..."
        />

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmLabel={confirmDialog.confirmLabel}
        />
      </main>
    </div>
  )
}

export default App
