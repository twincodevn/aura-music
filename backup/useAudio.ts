import { useState, useEffect, useRef, useCallback } from 'react';
import { EQ_PRESETS, EQ_FREQS } from '../lib/constants';
import type { Track } from '../lib/constants';
import { parseDuration } from '../lib/utils';

const LS = {
  get: <T,>(key: string, fallback: T): T => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
  },
  set: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  },
};

export function useAudio(onEnded?: () => void) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [currentTimeRaw, setCurrentTimeRaw] = useState(0);
  const [duration, setDuration] = useState('0:00');
  const [volume, setVolume] = useState<number>(() => LS.get<number>('volume', 0.8));
  
  const [eqPreset, setEqPreset] = useState<string>(() => LS.get<string>('eqPreset', 'flat'));
  const [eqBands, setEqBands] = useState<number[]>(() => LS.get<number[]>('eqBands', EQ_PRESETS.flat));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const currentTrackRef = useRef<Track | null>(null);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  // Init Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      const rawDur = isFinite(audio.duration) && audio.duration > 0 
        ? audio.duration 
        : parseDuration(currentTrackRef.current?.duration) || 0;
      
      if (rawDur > 0) {
        setProgress((audio.currentTime / rawDur) * 100);
        const dm = Math.floor(rawDur / 60);
        const ds = Math.floor(rawDur % 60).toString().padStart(2, '0');
        setDuration(`${dm}:${ds}`);
      }
      
      const m = Math.floor(audio.currentTime / 60);
      const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
      setCurrentTime(`${m}:${s}`);
      setCurrentTimeRaw(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      onEnded?.();
    });

    return () => { audio.pause(); audio.src = ''; };
  }, [onEnded]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    LS.set('volume', volume);
  }, [volume]);

  // Lazy Init Web Audio for EQ
  const initEq = useCallback(async () => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await ctx.resume();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      const filters = EQ_FREQS.map((_, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? 'lowshelf' : i === EQ_FREQS.length - 1 ? 'highshelf' : 'peaking';
        f.frequency.value = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000][i];
        f.gain.value = eqBands[i];
        f.Q.value = 1;
        return f;
      });
      eqFiltersRef.current = filters;

      const gain = ctx.createGain();
      gain.gain.value = 1;
      gainRef.current = gain;

      let prev: AudioNode = source;
      for (const f of filters) { prev.connect(f); prev = f; }
      prev.connect(gain);
      gain.connect(ctx.destination);
    } catch (err) {
      console.warn('[Audio] Context init failed:', err);
    }
  }, [eqBands]);

  // Sync EQ
  useEffect(() => {
    eqFiltersRef.current.forEach((f, i) => { f.gain.value = eqBands[i]; });
    LS.set('eqBands', eqBands);
    LS.set('eqPreset', eqPreset);
  }, [eqBands, eqPreset]);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Play error:', err);
      }
    }
  }, [currentTrack, isPlaying]);

  // MediaSession & Global Shortcuts
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => togglePlayPause());
    ms.setActionHandler('pause', () => togglePlayPause());
    
    const handleGlobalPlayPause = () => togglePlayPause();
    window.ipcRenderer.on('media-play-pause', handleGlobalPlayPause);

    return () => {
      ms.setActionHandler('play', null);
      ms.setActionHandler('pause', null);
      // Clean up IPC would ideally use a proper removeListener if available
    };
  }, [togglePlayPause]);

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channel,
      artwork: [
        { src: currentTrack.thumbnail || '', sizes: '512x512', type: 'image/png' }
      ]
    });
  }, [currentTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  const playTrack = useCallback(async (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (currentTrack?.id === track.id) {
       togglePlayPause();
       return;
    }

    audio.pause();
    setCurrentTrack(track);
    setIsPlaying(false);
    setStreamLoading(true);
    setProgress(0);
    setCurrentTime('0:00');
    setDuration(track.duration || '0:00');

    try {
      audio.src = `ytstream://stream/${track.id}`;
      audio.load();
      await audio.play();
      setIsPlaying(true);
      window.ipcRenderer.invoke(
        'logListen', 
        track.id, 
        track.title || 'Unknown Title', 
        track.thumbnail || null, 
        track.channel || 'Unknown Channel', 
        parseDuration(track.duration) || 0, 
        false
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Playback error:', err);
    } finally {
      setStreamLoading(false);
    }
  }, [currentTrack, togglePlayPause]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = isFinite(audio.duration) && audio.duration > 0 
      ? audio.duration 
      : parseDuration(currentTrackRef.current?.duration);
    if (!dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  }, []);

  return {
    audioRef,
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
    playTrack,
    togglePlayPause,
    seekTo,
    initEq,
  };
}
