import { useState, useEffect, useRef, useCallback } from 'react';
import { EQ_PRESETS, EQ_FREQS } from '../lib/constants';
import type { Track } from '../lib/constants';
import { parseDuration, displayDuration, getTrackCategory } from '../lib/utils';
import { getAudioSource } from '../lib/api';

const LS = {
  get: <T,>(key: string, fallback: T): T => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
  },
  set: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  },
};

const CROSSFADE_SEC = 5;
const CROSSFADE_STEPS = 50;

export function useAudio(onNext?: () => void) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [currentTimeRaw, setCurrentTimeRaw] = useState(0);
  const [duration, setDuration] = useState('0:00');
  const [volume, setVolume] = useState<number>(() => LS.get<number>('volume', 0.8));
  const [accentColor, setAccentColor] = useState('255, 255, 255');
  
  const [eqPreset, setEqPreset] = useState<string>(() => LS.get<string>('eqPreset', 'flat'));
  const [eqBands, setEqBands] = useState<number[]>(() => LS.get<number[]>('eqBands', EQ_PRESETS.flat));
  const [shuffle, setShuffle] = useState<boolean>(() => LS.get<boolean>('shuffle', false));
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>(() => LS.get<'off' | 'one' | 'all'>('repeat', 'off'));

  const toggleShuffle = useCallback(() => {
    setShuffle(v => { LS.set('shuffle', !v); return !v; });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat(v => {
      const next = v === 'off' ? 'one' : v === 'one' ? 'all' : 'off';
      LS.set('repeat', next);
      return next;
    });
  }, []);

  const audiosRef = useRef<HTMLAudioElement[]>([]);
  const activeIdxRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const sourcesRef = useRef<MediaElementAudioSourceNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isCrossfadingRef = useRef(false);
  const isInitializingRef = useRef(false);
  
  const currentTrackRef = useRef<Track | null>(null);
  const isPlayingRef = useRef(false);
  const listenedTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(Date.now());
  
  useEffect(() => { 
    // Reset listened time when track changes
    listenedTimeRef.current = 0; 
    lastUpdateRef.current = Date.now();
    currentTrackRef.current = currentTrack; 
  }, [currentTrack]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  // Init Audio Elements
  useEffect(() => {
    const a1 = new Audio();
    const a2 = new Audio();
    a1.preload = 'auto';
    a2.preload = 'auto';
    a1.crossOrigin = 'anonymous';
    a2.crossOrigin = 'anonymous';
    audiosRef.current = [a1, a2];

    const handleTimeUpdate = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      if (audio !== audiosRef.current[activeIdxRef.current]) return; // ignore idle audio updates
      
      const rawDur = isFinite(audio.duration) && audio.duration > 0 
        ? audio.duration 
        : parseDuration(currentTrackRef.current?.duration) || 0;
      
      if (rawDur > 0) {
        setProgress((audio.currentTime / rawDur) * 100);
        setDuration(displayDuration(rawDur));
      }
      
      setCurrentTime(displayDuration(audio.currentTime));
      setCurrentTimeRaw(audio.currentTime);

      // Track actual listened seconds (simple delta) — use ref to avoid stale closure
      const now = Date.now();
      if (isPlayingRef.current) {
        listenedTimeRef.current += (now - lastUpdateRef.current) / 1000;
      }
      lastUpdateRef.current = now;

      // Trigger crossfade automatically if nearing end
      if (rawDur > 0 && audio.currentTime >= rawDur - CROSSFADE_SEC && !isCrossfadingRef.current && onNextRef.current) {
        isCrossfadingRef.current = true;
        onNextRef.current(); // This will call playTrack which runs the fade overlap
      }
    };

    const handleEnded = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      if (audio === audiosRef.current[activeIdxRef.current]) {
        onNextRef.current?.();
      }
    };

    const handleError = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      const err = audio.error;
      const isActive = audio === audiosRef.current[activeIdxRef.current];

      if (err?.message === 'MEDIA_ELEMENT_ERROR: Empty src attribute') return;

      console.error(`[audio] ${isActive ? 'Active' : 'Idle'} Element Error:`, 
        err ? { code: err.code, message: err.message } : 'Unknown error');
      
      if (isActive) {
        setStreamLoading(false);
        setIsPlaying(false);
        // Auto-skip after delay to prevent "machine-gun" skipping if offline
        if (onNextRef.current) {
          console.warn('[audio] Auto-skipping due to playback error...');
          setTimeout(() => onNextRef.current?.(), 1000);
        }
      }
    };

    a1.addEventListener('timeupdate', handleTimeUpdate);
    a2.addEventListener('timeupdate', handleTimeUpdate);
    a1.addEventListener('ended', handleEnded);
    a2.addEventListener('ended', handleEnded);
    a1.addEventListener('error', handleError);
    a2.addEventListener('error', handleError);

    return () => { 
      a1.pause(); a1.src = ''; 
      a2.pause(); a2.src = ''; 
      a1.removeEventListener('timeupdate', handleTimeUpdate);
      a2.removeEventListener('timeupdate', handleTimeUpdate);
      a1.removeEventListener('ended', handleEnded);
      a2.removeEventListener('ended', handleEnded);
      a1.removeEventListener('error', handleError);
      a2.removeEventListener('error', handleError);
    };
  }, []);

  // Sync active volume
  useEffect(() => {
    const activeAudio = audiosRef.current[activeIdxRef.current];
    if (activeAudio && !isCrossfadingRef.current) {
      activeAudio.volume = volume;
    }
    LS.set('volume', volume);
  }, [volume]);

  // Init Web Audio for EQ (Atomic & Fail-safe)
  const initEq = useCallback(async () => {
    if (audioCtxRef.current || isInitializingRef.current || audiosRef.current.length === 0) return;
    
    isInitializingRef.current = true;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await ctx.resume();
      audioCtxRef.current = ctx;

      // Wrap in try-catch because element might already be connected to another source
      try {
        const s1 = ctx.createMediaElementSource(audiosRef.current[0]);
        const s2 = ctx.createMediaElementSource(audiosRef.current[1]);
        sourcesRef.current = [s1, s2];
        
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        analyserRef.current = analyser;

        
        // Let's rewrite the filter creation to be more robust
        const filters = EQ_FREQS.map((_, i) => {
          const f = ctx.createBiquadFilter();
          f.type = i === 0 ? 'lowshelf' : i === EQ_FREQS.length - 1 ? 'highshelf' : 'peaking';
          f.frequency.value = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000][i];
          f.gain.value = eqBands[i];
          f.Q.value = 1;
          return f;
        });
        eqFiltersRef.current = filters;

        let prevNode: AudioNode | AudioNode[] = [s1, s2];
        for (const f of filters) {
          if (Array.isArray(prevNode)) {
            prevNode[0].connect(f);
            prevNode[1].connect(f);
          } else {
            prevNode.connect(f);
          }
          prevNode = f;
        }
        if (!Array.isArray(prevNode)) {
          prevNode.connect(analyser);
          analyser.connect(ctx.destination);
        }
      } catch (connErr) {
        console.warn('[Audio] MediaElementSource creation failed (likely already connected):', connErr);
      }
    } catch (err) {
      console.warn('[Audio] Context init failed:', err);
    } finally {
      isInitializingRef.current = false;
      if (audioCtxRef.current?.state === 'suspended') {
        console.warn('[Audio] Context is suspended. User interaction required.');
      }
    }
  }, [eqBands]);

  // Sync EQ
  useEffect(() => {
    eqFiltersRef.current.forEach((f, i) => { f.gain.value = eqBands[i]; });
    LS.set('eqBands', eqBands);
    LS.set('eqPreset', eqPreset);
  }, [eqBands, eqPreset]);

  const performCrossfade = (oldAudio: HTMLAudioElement, newAudio: HTMLAudioElement) => {
    const stepTime = (CROSSFADE_SEC * 1000) / CROSSFADE_STEPS;
    let step = 0;
    
    oldAudio.volume = volume;
    newAudio.volume = 0;
    
    const interval = setInterval(() => {
      step++;
      const fadeFactor = step / CROSSFADE_STEPS;
      
      const newOldVol = Math.max(0, volume * (1 - fadeFactor));
      const newNewVol = Math.min(volume, volume * fadeFactor);
      
      if (isFinite(newOldVol)) oldAudio.volume = newOldVol;
      if (isFinite(newNewVol)) newAudio.volume = newNewVol;

      if (step >= CROSSFADE_STEPS) {
        clearInterval(interval);
        oldAudio.pause();
        oldAudio.src = '';
        oldAudio.currentTime = 0;
        oldAudio.volume = volume; // Restore for next time
        newAudio.volume = volume;
        isCrossfadingRef.current = false;
      }
    }, stepTime);
  };

  const togglePlayPause = useCallback(async () => {
    const active = audiosRef.current[activeIdxRef.current];
    if (!active || !currentTrack) return;
    if (isPlaying) {
      active.pause();
      setIsPlaying(false);
    } else {
      try {
        await active.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Play error:', err);
      }
    }
  }, [currentTrack, isPlaying]);

  // Keep a stable ref so IPC handlers don't cause re-registration on every render
  const togglePlayPauseRef = useRef(togglePlayPause);
  useEffect(() => { togglePlayPauseRef.current = togglePlayPause; }, [togglePlayPause]);

  // MediaSession — registered ONCE, reads latest handler via ref
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const stableHandler = () => togglePlayPauseRef.current();
    ms.setActionHandler('play', stableHandler);
    ms.setActionHandler('pause', stableHandler);
    window.ipcRenderer.on('media-play-pause', stableHandler);
    return () => {
      ms.setActionHandler('play', null);
      ms.setActionHandler('pause', null);
      window.ipcRenderer.removeListener('media-play-pause', stableHandler);
    };
  }, []); // ← empty deps: register once, use ref for freshness

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channel,
      artwork: [{ src: currentTrack.thumbnail || '', sizes: '512x512', type: 'image/png' }]
    });
  }, [currentTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  const playTrack = useCallback(async (track: Track) => {
    const activeAudio = audiosRef.current[activeIdxRef.current];
    
    // Toggle play if it's the exact same track
    if (currentTrack?.id === track.id) {
       togglePlayPause();
       return;
    }

    // LOG PREVIOUS TRACK STATS BEFORE SWITCHING
    if (currentTrackRef.current) {
      const prev = currentTrackRef.current;
      const vibe = getTrackCategory(prev.duration)?.label || 'Song';
      window.ipcRenderer.invoke(
        'logListen', prev.id, prev.title, 
        prev.thumbnail, prev.channel, 
        parseDuration(prev.duration), 
        false, // not a 'skipped' in the failed-to-play sense
        Math.floor(listenedTimeRef.current),
        vibe,
        prev.channelThumbnail
      );
    }

    const wasFading = isCrossfadingRef.current;
    if (wasFading) {
      // If we clicked next while crossfading, fast-forward the crossfade by killing the old audio
      activeAudio.pause();
      activeAudio.src = '';
    }

    // Determine the *new* audio element
    const newIdx = 1 - activeIdxRef.current;
    const newAudio = audiosRef.current[newIdx];
    
    setCurrentTrack(track);
    setIsPlaying(false);
    setStreamLoading(true);
    setProgress(0);
    setCurrentTime('0:00');
    setDuration(track.duration || '0:00');

    try {
      // Don't block playback on WebAudio init
      initEq().catch(console.warn);
      newAudio.src = getAudioSource(track.id);
      
      await newAudio.play();
      setIsPlaying(true);
      
      // If the old audio was playing and isn't the same track, crossfade!
      if (!wasFading && !activeAudio.paused && activeAudio.currentTime > 0 && activeAudio.src) {
        isCrossfadingRef.current = true;
        performCrossfade(activeAudio, newAudio);
      } else {
        // No crossfade needed (was paused, or fresh start)
        newAudio.volume = volume;
        activeAudio.pause();
        activeAudio.src = '';
      }
      
      activeIdxRef.current = newIdx; // Swap active immediately
      
      // Extract color
      if (track.thumbnail) {
        import('../lib/colorUtils').then(({ extractDominantColor }) => {
          extractDominantColor(track.thumbnail).then(rgb => {
            if (rgb) setAccentColor(rgb.primary);
          });
        });
      }
      // We now log when the track ends or is switched.
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Playback error:', err);
    } finally {
      setStreamLoading(false);
    }
  }, [currentTrack, volume, togglePlayPause]);

  const seekTo = useCallback((val: number | React.MouseEvent<HTMLDivElement>) => {
    const activeAudio = audiosRef.current[activeIdxRef.current];
    if (!activeAudio) return;
    const dur = isFinite(activeAudio.duration) && activeAudio.duration > 0 
      ? activeAudio.duration 
      : parseDuration(currentTrackRef.current?.duration);
    if (!dur) return;

    if (typeof val === 'number') {
      activeAudio.currentTime = (val / 100) * dur;
    } else {
      const rect = val.currentTarget.getBoundingClientRect();
      activeAudio.currentTime = ((val.clientX - rect.left) / rect.width) * dur;
    }
  }, []);

  return {
    audioRef: { current: audiosRef.current[activeIdxRef.current] }, // Provide a faux ref to make backwards-compatibility easier (like Sleep timer accessing .pause())
    currentTrack,
    isPlaying,
    streamLoading,
    progress,
    currentTime,
    currentTimeRaw,
    duration,
    volume,
    setVolume,
    eqPreset,
    setEqPreset,
    eqBands,
    setEqBands,
    initEq,
    togglePlayPause,
    toggleMute: useCallback(() => {
      setVolume(v => {
        if (v > 0) {
          LS.set('lastVolume', v);
          return 0;
        }
        return LS.get<number>('lastVolume', 0.8);
      });
    }, []),
    playTrack,
    seekTo,
    accentColor,
    analyserRef,
    shuffle,
    repeat,
    toggleShuffle,
    toggleRepeat,
  };
}
