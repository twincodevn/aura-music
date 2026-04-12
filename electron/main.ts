import { app, BrowserWindow, ipcMain, protocol, net, globalShortcut } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { searchMusic, searchAdvancedMusic, getSearchSuggestions, getRelatedTracks, getStreamUrl, prefetchStreamUrl, fetchLyrics, getDynamicDiscoveryMix, fetchArtistAvatar, getTrendingCharts } from './crawler.js'
import {
  initDb,
  logListen,
  getSmartPlaylist,
  getCachedSongPath,
  saveCachedSong,
  removeCachedSong,
  getAllCachedIds,
  getCachedTracksWithMeta,
  getListeningStats,
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  getPlaylistTracks,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  renamePlaylist,
  updateChannelAvatar,
  updateSongMetadata,
  getArtistStats,
  hasCachedSong,
  clearCachedSongs
} from './db.js';
import https from 'node:https';

// Aura 6.2: Disable Audio Sandbox on macOS to prevent device capture errors
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('disable-features', 'AudioServiceSandbox');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register custom protocol for streaming to bypass Chromium's Strict-Origin/Referrer throttling
protocol.registerSchemesAsPrivileged([
  { scheme: 'ytstream', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true, corsEnabled: true } }
]);

process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

let win: BrowserWindow | null;
let miniPlayer: BrowserWindow | null = null;

// ─── High-Speed DISK Buffering Logic (Persistent) ───────────
const MEDIA_DIR = path.join(app.getPath('userData'), 'media-cache');
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

// Track active downloads to prevent duplicate processes
const activeDownloads = new Map<string, Promise<string | null>>();

async function ensureDownloaded(
  videoId: string,
  meta?: { title?: string; thumbnail?: string; channel?: string; duration?: string; channelThumbnail?: string }
): Promise<string | null> {
  // 1. Check if already known in DB
  const dbPath = getCachedSongPath(videoId);
  if (dbPath && fs.existsSync(dbPath)) {
    // Backfill metadata if it was missing
    if (meta?.title) saveCachedSong(videoId, dbPath, meta);
    return dbPath;
  }

  // 2. Check filesystem just in case DB is out of sync
  const filePath = path.join(MEDIA_DIR, `${videoId}.m4a`);
  if (fs.existsSync(filePath)) {
    saveCachedSong(videoId, filePath, meta);
    return filePath;
  }

  // 3. Check if already being downloaded right now
  if (activeDownloads.has(videoId)) {
    console.log(`[disk-cache] Joining existing download for: ${videoId}`);
    return activeDownloads.get(videoId)!;
  }

  const downloadPromise = new Promise<string | null>(async (resolve) => {
    console.log(`[disk-cache] Downloading: ${videoId}`);
    try {
      const streamUrl = await getStreamUrl(videoId);
      if (!streamUrl) {
        activeDownloads.delete(videoId);
        resolve(null);
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      https.get(streamUrl, (response) => {
        if (response.statusCode !== 200) {
          fileStream.close();
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          activeDownloads.delete(videoId);
          resolve(null);
          return;
        }
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`[disk-cache] Completed: ${videoId} (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)}MB)`);
          saveCachedSong(videoId, filePath, meta);
          activeDownloads.delete(videoId);
          resolve(filePath);
        });
      }).on('error', (err) => {
        console.error(`[disk-cache] Download error for ${videoId}:`, err);
        fileStream.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        activeDownloads.delete(videoId);
        resolve(null);
      });
    } catch (e) {
      console.error(`[disk-cache] Download exception for ${videoId}:`, e);
      activeDownloads.delete(videoId);
      resolve(null);
    }
  });

  activeDownloads.set(videoId, downloadPromise);
  return downloadPromise;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    vibrancy: 'sidebar',
    // Removed visualEffectState: 'active' to address macOS daemon error
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
  // win.webContents.openDevTools(); // DEBUG: remove after fix
  win.on('closed', () => { win = null; });
}

function createMiniPlayer() {
  if (miniPlayer) {
    miniPlayer.focus();
    return;
  }

  miniPlayer = new BrowserWindow({
    width: 340,
    height: 120,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    vibrancy: 'popover',
    backgroundColor: '#00000000',
    transparent: true,
    hasShadow: true,
    titleBarStyle: 'hidden'
  });

  if (VITE_DEV_SERVER_URL) {
    miniPlayer.loadURL(`${VITE_DEV_SERVER_URL}?mini=true`);
  } else {
    miniPlayer.loadFile(path.join(RENDERER_DIST, 'index.html'), { query: { mini: 'true' } });
  }

  miniPlayer.on('closed', () => { miniPlayer = null; });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.whenReady().then(() => {
  initDb();
  createWindow();

  ipcMain.handle('searchMusic', async (_, query, timeframe) => searchMusic(query, timeframe));
  ipcMain.handle('searchAdvancedMusic', async (_, query, filters) => searchAdvancedMusic(query, filters));
  ipcMain.handle('getSearchSuggestions', async (_, query) => getSearchSuggestions(query));
  ipcMain.handle('getTrendingCharts', async () => getTrendingCharts());
  ipcMain.handle('getRelatedTracks', async (_, videoId) => getRelatedTracks(videoId));
  ipcMain.handle('logListen', (_, videoId, title, thumbnail, channel, duration, skipped, listenedSeconds, vibe, channelThumbnail) => {
    logListen(videoId, title, thumbnail, channel, duration, skipped, listenedSeconds, vibe, channelThumbnail);
    // Backfill metadata into cached_songs if this track is already cached
    const filePath = getCachedSongPath(videoId);
    if (filePath) {
      saveCachedSong(videoId, filePath, {
        title,
        thumbnail,
        channel,
        channelThumbnail,
        duration: duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : undefined
      });
    }
  });
  ipcMain.handle('getListeningStats', () => {
    const stats = getListeningStats();

    // Background heal: if any top channel is missing a real avatar, try to fetch it
    stats.topChannels.forEach(async (c: any) => {
      try {
        // If thumbnail doesn't look like a real channel avatar (from googleusercontent or ggpht), repair it
        const isAvatar = c.thumbnail?.includes('googleusercontent.com') || c.thumbnail?.includes('ggpht.com');

        if (!isAvatar) {
          console.log(`[main] Healing avatar for: ${c.channel}`);
          const realAvatar = await fetchArtistAvatar(c.channel);
          if (realAvatar) {
            updateChannelAvatar(c.channel, realAvatar);
          }
        }
      } catch (err) {
        console.error(`[main] Healing failed for ${c.channel}:`, err);
      }
    });

    // Background heal: if any top song is missing a thumbnail, try to fetch it
    stats.topTracks.forEach(async (track: any) => {
      try {
        // If thumbnail is empty or generic, repair it using the Video ID directly
        if (!track.thumbnail || track.thumbnail.length < 10) {
          console.log(`[main] Healing song thumbnail with Direct ID: ${track.id}`);
          // Using fetchArtistAvatar's robust logic pattern, but for a single video
          const { searchMusic } = await import('./crawler.js'); // Use searchMusic for simple metadata
          const results = await searchMusic(track.id); // Searching by ID usually returns the exact video
          const bestMatch = results.find(r => r.id === track.id) || results[0];

          if (bestMatch && bestMatch.thumbnail) {
            updateSongMetadata(track.id, bestMatch.title, bestMatch.thumbnail, bestMatch.channel);
          }
        }
      } catch (err) {
        console.error(`[main] Song healing failed for ${track.id}:`, err);
      }
    });

    return stats;
  });

  ipcMain.handle('getArtistStats', (_, channel: string) => {
    return getArtistStats(channel);
  });
  // Playlist Handlers
  ipcMain.handle('getPlaylists', () => getPlaylists());
  ipcMain.handle('createPlaylist', (_, name) => createPlaylist(name));
  ipcMain.handle('deletePlaylist', (_, id) => deletePlaylist(id));
  ipcMain.handle('getPlaylistTracks', (_, id) => getPlaylistTracks(id));
  ipcMain.handle('addTrackToPlaylist', (_, id, track) => addTrackToPlaylist(id, track));
  ipcMain.handle('removeTrackFromPlaylist', (_, id, videoId) => removeTrackFromPlaylist(id, videoId));
  ipcMain.handle('renamePlaylist', (_, id, name) => renamePlaylist(id, name));
  ipcMain.handle('getSmartPlaylist', (_, mood) => getSmartPlaylist(mood));
  ipcMain.handle('getDynamicDiscoveryMix', async () => getDynamicDiscoveryMix());
  ipcMain.handle('getStreamUrl', async (_, videoId) => getStreamUrl(videoId));
  ipcMain.handle('prefetchStreamUrl', (_, videoId: string) => {
    // ONLY fetch URL to populate memory cache, DON'T download to disk unless explicit
    prefetchStreamUrl(videoId);
  });

  ipcMain.handle('downloadTrack', async (_, videoId: string, meta?: any) => {
    return ensureDownloaded(videoId, meta);
  });

  ipcMain.handle('deleteCachedTrack', async (_, videoId: string) => {
    try {
      const filePath = getCachedSongPath(videoId);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      removeCachedSong(videoId);
      return true;
    } catch (err) {
      console.error('[main] deleteCachedTrack failed:', err);
      return false;
    }
  });

  ipcMain.handle('clearMusicCache', async () => {
    try {
      // 1. Delete all files in media-cache
      const files = fs.readdirSync(MEDIA_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(MEDIA_DIR, file));
      }
      // 2. Clear Database
      clearCachedSongs();
      return true;
    } catch (err) {
      console.error('[main] clearMusicCache failed:', err);
      return false;
    }
  });

  // Lyrics
  ipcMain.handle('fetchLyrics', async (_, title: string, artist: string, durationSecs?: number, videoId?: string) => {
    const { fetchLyrics } = await import('./crawler.js');
    return fetchLyrics(title, artist, durationSecs, videoId);
  });

  // Offline / Cache info
  ipcMain.handle('getCachedIds', () => getAllCachedIds());
  ipcMain.handle('getCachedTracks', () => getCachedTracksWithMeta());

  // Mini Player Helpers
  ipcMain.on('toggle-mini-player', () => {
    if (miniPlayer) {
      miniPlayer.close();
    } else {
      createMiniPlayer();
    }
  });

  ipcMain.on('close-mini-player', () => {
    if (miniPlayer) miniPlayer.close();
  });

  ipcMain.on('mini-player-set-top', (_, val: boolean) => {
    if (miniPlayer) miniPlayer.setAlwaysOnTop(val);
  });

  // Global Media Keys
  globalShortcut.register('MediaPlayPause', () => {
    win?.webContents.send('media-play-pause');
    miniPlayer?.webContents.send('media-play-pause');
  });

  globalShortcut.register('MediaNextTrack', () => {
    win?.webContents.send('media-next');
    miniPlayer?.webContents.send('media-next');
  });

  globalShortcut.register('MediaPreviousTrack', () => {
    win?.webContents.send('media-prev');
    miniPlayer?.webContents.send('media-prev');
  });

  // DEBUG: IPC channel to echo stream result back to renderer
  ipcMain.handle('debugGetStreamUrl', async (_, videoId: string) => {
    try {
      console.log(`[DEBUG] Testing getStreamUrl for: ${videoId}`);
      const url = await getStreamUrl(videoId);
      console.log(`[DEBUG] getStreamUrl result: ${url ? url.slice(0, 80) + '...' : 'NULL'}`);
      return { success: !!url, urlPreview: url ? url.slice(0, 100) : null };
    } catch (e: any) {
      console.error('[DEBUG] getStreamUrl threw:', e?.message);
      return { success: false, error: e?.message };
    }
  });

  protocol.handle('ytstream', async (request) => {
    const urlObj = new URL(request.url);
    // Support both ytstream://VIDEO_ID and ytstream://stream/VIDEO_ID formats
    // For ytstream://stream/AicW-v4_8PI: hostname="stream", pathname="/AicW-v4_8PI"
    // So we prefer the last non-empty path segment, fallback to hostname
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const videoIdWithExt = (pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : urlObj.hostname) || '';
    const videoId = videoIdWithExt.replace(/\.m4a$|\.mp3$/i, '');

    console.log(`[main] Protocol request: ${request.url} -> videoId: ${videoId}`);

    const CORS_HEADERS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range',
    };

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!videoId) {
      console.error(`[main] Failed to extract videoId from URL: ${request.url}`);
      return new Response('Bad Request: Missing Video ID', { status: 400, headers: CORS_HEADERS });
    }

    // Step 1: Check if already on disk
    const dbPath = getCachedSongPath(videoId);
    let filePath = (dbPath && fs.existsSync(dbPath)) ? dbPath : null;

    if (!filePath) {
      // Step 2: If NOT on disk, stream directly from YouTube without saving
      const streamUrl = await getStreamUrl(videoId);
      if (!streamUrl) return new Response('Not Found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });

      console.log(`[main] Direct streaming from YouTube for: ${videoId}`);
      // Aura 6.2: Clean headers (preserve only Range and User-Agent) 
      // Avoids 403 Forbidden from YouTube due to browser-specific headers like sec-ch-ua
      const cleanHeaders = new Headers();
      const allowedHeaders = ['range', 'user-agent'];
      request.headers.forEach((value, key) => {
        if (allowedHeaders.includes(key.toLowerCase())) {
          cleanHeaders.set(key, value);
        }
      });

      try {
        const response = await net.fetch(streamUrl, {
          method: request.method,
          headers: cleanHeaders
        });

        console.log(`[main] YouTube response status for ${videoId}: ${response.status}`);

        // Re-build response with CORS headers injected
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      } catch (err) {
        console.error(`[main] net.fetch failed for video ${videoId}:`, err);
        return new Response('Stream Fetch Error', { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    // Step 3: Serve the cached file
    const stats = fs.statSync(filePath);
    const range = request.headers.get('Range');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = (end - start) + 1;

      const stream = fs.createReadStream(filePath, { start, end });
      return new Response(Readable.toWeb(stream) as any, {
        status: 206,
        statusText: 'Partial Content',
        headers: {
          'Content-Type': 'audio/mp4',
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range',
        }
      });
    }

    return new Response(Readable.toWeb(fs.createReadStream(filePath)) as any, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Length': stats.size.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range',
      }
    });
  });
});
