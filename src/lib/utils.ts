import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function getRecommendedMoods(hour: number = new Date().getHours()): string[] {
  if (hour >= 5 && hour < 11) {
    return ['morning-coffee', 'energetic', 'chill-vibes'];
  } else if (hour >= 11 && hour < 16) {
    return ['deep-focus', 'energetic', 'chill-vibes'];
  } else if (hour >= 16 && hour < 20) {
    return ['sunset-drive', 'chill-vibes', 'evening-relax'];
  } else if (hour >= 20 && hour < 23) {
    return ['evening-relax', 'late-night', 'chill-vibes'];
  } else {
    return ['late-night', 'sleepy-time', 'deep-focus'];
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatViews = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return String(v);
};

export function parseDuration(dur?: string | number): number {
  if (!dur) return 0;
  if (typeof dur === 'number') return dur;
  const parts = String(dur).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

export function getTrackCategory(durationStr?: string | number): { label: string, styles: string } | null {
  if (!durationStr) return null;
  const secs = parseDuration(durationStr);
  if (secs > 3600) { // > 1 hour
    return { label: 'Podcast/Set', styles: 'text-purple-300 bg-purple-500/10 border-purple-500/20' };
  } else if (secs >= 360) { // >= 6 mins
    return { label: 'Mix/EP', styles: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
  }
  return null;
}

export function displayDuration(dur?: string | number): string {
  if (!dur) return '—';
  const secs = parseDuration(dur);
  if (isNaN(secs) || secs <= 0) return '—';
  
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
