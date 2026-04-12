import { get, set } from 'idb-keyval';

export interface ListenRecord {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  timestamp: number;
}

const DB_KEYS = {
  HISTORY: 'aura_listen_history',
  PLAYLISTS: 'aura_playlists',
  PLAYLIST_TRACKS: 'aura_playlist_tracks_', // prefix
  LIKED_SONGS: 'aura_liked_songs',
};

// ─── HISTORY & LOGGING ───────────────────────

export async function logListen(track: any) {
  const history: ListenRecord[] = (await get(DB_KEYS.HISTORY)) || [];
  
  // Remove if it exists to move it to the top
  const filtered = history.filter((vId) => vId.id !== track.id);
  
  filtered.unshift({
    id: track.id,
    title: track.title,
    channel: track.channel,
    thumbnail: track.thumbnail,
    duration: track.duration,
    timestamp: Date.now()
  });

  // Keep only the last 500 records to prevent memory overflow
  if (filtered.length > 500) {
    filtered.length = 500;
  }

  await set(DB_KEYS.HISTORY, filtered);
}

// ─── SMART PLAYLISTS ───────────────────────

export async function getSmartPlaylist(type: string): Promise<any[]> {
  const history: ListenRecord[] = (await get(DB_KEYS.HISTORY)) || [];

  if (type === 'recent') {
    return history.map(t => ({
      id: t.id,
      title: t.title,
      channel: t.channel,
      thumbnail: t.thumbnail,
      duration: t.duration
    }));
  }

  if (type === 'most_played') {
    const counts = history.reduce((acc, obj) => {
      acc[obj.id] = (acc[obj.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // De-duplicate history, sort by play count
    const uniqueTracks = Array.from(new Map(history.map(item => [item.id, item])).values());
    uniqueTracks.sort((a, b) => counts[b.id] - counts[a.id]);

    return uniqueTracks.slice(0, 50).map(t => ({
      id: t.id,
      title: t.title,
      channel: t.channel,
      thumbnail: t.thumbnail,
      duration: t.duration
    }));
  }

  return [];
}

export async function getListeningStats() {
  const history: ListenRecord[] = (await get(DB_KEYS.HISTORY)) || [];

  const topSongsMap = new Map();
  const topChannelsMap = new Map();
  let totalListeningTimeMs = 0; // rough estimation

  history.forEach(track => {
    topSongsMap.set(track.id, {
      ...track,
      playCount: (topSongsMap.get(track.id)?.playCount || 0) + 1
    });

    if (track.channel) {
      topChannelsMap.set(track.channel, {
        channel: track.channel,
        thumbnail: track.thumbnail, // channel avatar is usually fetched later, use song thumb for now
        playCount: (topChannelsMap.get(track.channel)?.playCount || 0) + 1
      });
    }

    // Estimate duration
    if (track.duration) {
      const parts = track.duration.split(':').map(Number);
      if (parts.length === 2) {
         totalListeningTimeMs += (parts[0] * 60 + parts[1]) * 1000;
      }
    } else {
         totalListeningTimeMs += 3 * 60 * 1000; // 3 min default
    }
  });

  const topSongs = Array.from(topSongsMap.values())
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 10);

  const topChannels = Array.from(topChannelsMap.values())
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 10);

  const totalSongsPlayed = history.length;
  // Convert MS to hours
  const totalHours = Math.floor(totalListeningTimeMs / (1000 * 60 * 60));

  return {
    totalSongsPlayed,
    totalListeningTimeHours: totalHours,
    topSongs,
    topChannels
  };
}

// ─── PLAYLISTS ───────────────────────

export async function getPlaylists(): Promise<any[]> {
  return (await get(DB_KEYS.PLAYLISTS)) || [];
}

export async function createPlaylist(name: string): Promise<string> {
  const playlists = await getPlaylists();
  const id = Date.now().toString();
  playlists.push({ id, name, trackCount: 0 });
  await set(DB_KEYS.PLAYLISTS, playlists);
  return id;
}

export async function deletePlaylist(id: string) {
  const playlists = await getPlaylists();
  const filtered = playlists.filter(p => p.id !== id);
  await set(DB_KEYS.PLAYLISTS, filtered);
  // Also delete the tracks associated with it
  await set(DB_KEYS.PLAYLIST_TRACKS + id, undefined);
}

export async function renamePlaylist(id: string, name: string) {
  const playlists = await getPlaylists();
  const p = playlists.find(p => p.id === id);
  if (p) {
    p.name = name;
    await set(DB_KEYS.PLAYLISTS, playlists);
  }
}

export async function getPlaylistTracks(id: string): Promise<any[]> {
  // Check for smart playlists first
  if (['recent', 'most_played', 'focus', 'chill', 'hype'].includes(id)) {
    return getSmartPlaylist(id);
  }
  return (await get(DB_KEYS.PLAYLIST_TRACKS + id)) || [];
}

export async function addTrackToPlaylist(id: string, track: any) {
  const tracks = await getPlaylistTracks(id);
  if (!tracks.find(t => t.id === track.id)) {
    tracks.push(track);
    await set(DB_KEYS.PLAYLIST_TRACKS + id, tracks);
    
    // Update track count in main playlist list
    const playlists = await getPlaylists();
    const p = playlists.find(p => p.id === id);
    if (p) {
      p.trackCount = tracks.length;
      await set(DB_KEYS.PLAYLISTS, playlists);
    }
  }
}

export async function removeTrackFromPlaylist(id: string, videoId: string) {
  const tracks = await getPlaylistTracks(id);
  const filtered = tracks.filter(t => t.id !== videoId);
  await set(DB_KEYS.PLAYLIST_TRACKS + id, filtered);
  
  // Update track count
  const playlists = await getPlaylists();
  const p = playlists.find(p => p.id === id);
  if (p) {
    p.trackCount = filtered.length;
    await set(DB_KEYS.PLAYLISTS, playlists);
  }
}

