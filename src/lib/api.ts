import * as db from './db';

let API_URL = '';
// Environment-aware API URL logic
if (typeof window !== 'undefined') {
  // 1. Check for injected build-time environment variable (Production)
  // 2. Default to localhost:3000 if on localhost (Development)
  // 3. Fallback to same-origin /api (Proxy mode)
  API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');
}

/**
 * Universal backend proxy handler to replace ipcRenderer.invoke.
 * Automatically routes SQLite DB calls to IndexedDB locally,
 * and external requests (youtube search, lyrics) to the Express API.
 */
export async function apiInvoke(channel: string, ...args: any[]): Promise<any> {
  // DB & History methods
  if (channel === 'logListen') {
    return db.logListen({
        id: args[0], 
        title: args[1], 
        thumbnail: args[2], 
        channel: args[3], 
        duration: args[4]
    });
  }
  if (channel === 'getListeningStats') {
    return db.getListeningStats();
  }
  if (channel === 'getSmartPlaylist') {
    return db.getSmartPlaylist(args[0]);
  }
  if (channel === 'getPlaylists') {
    return db.getPlaylists();
  }
  if (channel === 'createPlaylist') {
    return db.createPlaylist(args[0]);
  }
  if (channel === 'deletePlaylist') {
    return db.deletePlaylist(args[0]);
  }
  if (channel === 'renamePlaylist') {
    return db.renamePlaylist(args[0], args[1]);
  }
  if (channel === 'getPlaylistTracks') {
    return db.getPlaylistTracks(args[0]);
  }
  if (channel === 'addTrackToPlaylist') {
    return db.addTrackToPlaylist(args[0], args[1]);
  }
  if (channel === 'removeTrackFromPlaylist') {
    return db.removeTrackFromPlaylist(args[0], args[1]);
  }

  // Cache & Download methods (Mocked for Web)
  if (channel === 'getCachedTracks' || channel === 'getCachedIds' || channel === 'getOfflineTracks') {
    // For a global web app, we skip native disk caching for now
    return [];
  }
  if (channel === 'downloadTrack') {
    console.log('[API] downloadTrack mocked for web:', args[0]);
    return true; 
  }
  if (channel === 'deleteCachedTrack') {
    return true;
  }
  if (channel === 'clearMusicCache') {
    return true;
  }

  // API Backend methods
  try {
    if (channel === 'getSearchSuggestions') {
      const res = await fetch(`${API_URL}/suggestions?q=${encodeURIComponent(args[0])}`);
      return res.json();
    }
    if (channel === 'getTrendingCharts') {
      const res = await fetch(`${API_URL}/trending`);
      return res.json();
    }
    if (channel === 'getRelatedTracks') {
      const res = await fetch(`${API_URL}/related/${args[0]}`);
      return res.json();
    }
    if (channel === 'getDynamicDiscoveryMix') {
      const res = await fetch(`${API_URL}/discovery`);
      return res.json();
    }
    if (channel === 'searchAdvancedMusic') {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(args[0])}&advanced=true`);
      return res.json();
    }
    if (channel === 'searchMusic') {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(args[0])}`);
      return res.json();
    }
    if (channel === 'fetchLyrics') {
      const qs = new URLSearchParams({ title: args[0] || '', artist: args[1] || '' });
      if (args[2]) qs.set('duration', args[2]);
      const res = await fetch(`${API_URL}/lyrics/${args[3] || ''}?${qs.toString()}`);
      return res.json();
    }
    if (channel === 'prefetchStreamUrl') {
      const res = await fetch(`${API_URL}/prefetch/${args[0]}`, { method: 'PATCH' });
      return;
    }
    if (channel === 'getStreamUrl') {
      const res = await fetch(`${API_URL}/stream/${args[0]}`);
      return res.text();
    }
  } catch (err) {
    console.error(`[API] Network error calling ${channel}:`, err);
    throw err;
  }

  console.warn(`[API] Unimplemented channel: ${channel}`);
  return null;
}

export function apiSend(channel: string, ...args: any[]) {
  // Fire and forget methods like openExternal can be adapted for browser
  if (channel === 'openExternal') {
    window.open(args[0], '_blank');
  }
}

export function getAudioSource(videoId: string) {
  // Serve via API proxy to avoid strict CORS and natively use browser codecs
  return `${API_URL}/stream/${videoId}`;
}
