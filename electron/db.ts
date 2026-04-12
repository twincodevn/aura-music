import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';

export function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'music-app.db');
  const db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS listening_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      videoId TEXT NOT NULL,
      title TEXT,
      thumbnail TEXT,
      channel TEXT,
      channelThumbnail TEXT,
      duration INTEGER,
      listenedSeconds INTEGER DEFAULT 0,
      vibe TEXT,
      listenedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      skipped BOOLEAN DEFAULT 0
    );
  `);

  // Migration: Ensure new columns exist for older installations
  const tableInfo = db.prepare("PRAGMA table_info(listening_history)").all() as any[];
  const columns = tableInfo.map(c => c.name);
  
  if (!columns.includes('thumbnail')) db.exec('ALTER TABLE listening_history ADD COLUMN thumbnail TEXT');
  if (!columns.includes('channel'))   db.exec('ALTER TABLE listening_history ADD COLUMN channel TEXT');
  if (!columns.includes('duration'))  db.exec('ALTER TABLE listening_history ADD COLUMN duration INTEGER');
  if (!columns.includes('listenedSeconds')) db.exec('ALTER TABLE listening_history ADD COLUMN listenedSeconds INTEGER DEFAULT 0');
  if (!columns.includes('vibe')) db.exec('ALTER TABLE listening_history ADD COLUMN vibe TEXT');
  if (!columns.includes('channelThumbnail')) db.exec('ALTER TABLE listening_history ADD COLUMN channelThumbnail TEXT');

  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlistId INTEGER,
      videoId TEXT NOT NULL,
      title TEXT,
      thumbnail TEXT,
      channel TEXT,
      duration TEXT,
      views INTEGER DEFAULT 0,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      position INTEGER,
      PRIMARY KEY (playlistId, videoId),
      FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE
    );
  `);

  // Migration for playlist_tracks
  const ptInfo = db.prepare("PRAGMA table_info(playlist_tracks)").all() as any[];
  const ptColumns = ptInfo.map(c => c.name);
  if (!ptColumns.includes('views')) db.exec('ALTER TABLE playlist_tracks ADD COLUMN views INTEGER DEFAULT 0');
  if (!ptColumns.includes('playlistId') && ptColumns.includes('playlist_id')) {
    // This is for fixing potential older naming issues
    db.exec('ALTER TABLE playlist_tracks RENAME COLUMN playlist_id TO playlistId');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS cached_songs (
      videoId TEXT PRIMARY KEY,
      filePath TEXT,
      title TEXT,
      thumbnail TEXT,
      channel TEXT,
      channelThumbnail TEXT,
      duration TEXT,
      cachedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add metadata columns to older cached_songs tables
  const csInfo = db.prepare("PRAGMA table_info(cached_songs)").all() as any[];
  const csColumns = csInfo.map(c => c.name);
  if (!csColumns.includes('title'))     db.exec("ALTER TABLE cached_songs ADD COLUMN title TEXT");
  if (!csColumns.includes('thumbnail')) db.exec("ALTER TABLE cached_songs ADD COLUMN thumbnail TEXT");
  if (!csColumns.includes('channel'))   db.exec("ALTER TABLE cached_songs ADD COLUMN channel TEXT");
  if (!csColumns.includes('duration'))  db.exec("ALTER TABLE cached_songs ADD COLUMN duration TEXT");
  if (!csColumns.includes('channelThumbnail')) db.exec("ALTER TABLE cached_songs ADD COLUMN channelThumbnail TEXT");

  return db;
}

let dbInstance: any | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = initDb();
  }
  return dbInstance;
}

export function logListen(videoId: string, title?: string, thumbnail?: string, channel?: string, duration?: number, skipped: boolean = false, listenedSeconds: number = 0, vibe?: string, channelThumbnail?: string) {
  const db = getDb();
  
  const stmt = db.prepare(`
    INSERT INTO listening_history (videoId, title, thumbnail, channel, channelThumbnail, duration, skipped, listenedSeconds, vibe)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    videoId, 
    title || 'Unknown Title', 
    thumbnail || null, 
    channel || 'Unknown Channel', 
    channelThumbnail || null,
    duration || 0, 
    skipped ? 1 : 0,
    listenedSeconds,
    vibe || null
  );
}

export function saveCachedSong(
  videoId: string,
  filePath: string,
  meta?: { title?: string; thumbnail?: string; channel?: string; duration?: string; channelThumbnail?: string }
) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO cached_songs (videoId, filePath, title, thumbnail, channel, channelThumbnail, duration) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    videoId,
    filePath,
    meta?.title     || null,
    meta?.thumbnail || null,
    meta?.channel   || null,
    meta?.channelThumbnail || null,
    meta?.duration  || null
  );
}

export function getCachedSongPath(videoId: string): string | null {
  const db = getDb();
  const stmt = db.prepare('SELECT filePath FROM cached_songs WHERE videoId = ?');
  const row = stmt.get(videoId) as { filePath: string } | undefined;
  return row?.filePath || null;
}

export function removeCachedSong(videoId: string) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM cached_songs WHERE videoId = ?');
  stmt.run(videoId);
}

export function getAllCachedIds(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT videoId FROM cached_songs').all() as { videoId: string }[];
  return rows.map(r => r.videoId);
}

export function hasCachedSong(videoId: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT 1 FROM cached_songs WHERE videoId = ?').get(videoId);
  return !!row;
}

export function clearCachedSongs() {
  const db = getDb();
  db.prepare('DELETE FROM cached_songs').run();
}

export function getCachedTracksWithMeta() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      cs.videoId as id,
      COALESCE(
        CASE WHEN cs.title = 'Unknown' THEN NULL ELSE cs.title END,
        CASE WHEN lh.title = 'Unknown' THEN NULL ELSE lh.title END,
        'Bản nhạc đã lưu (' || SUBSTR(cs.videoId, 1, 6) || ')'
      ) as title,
      COALESCE(cs.thumbnail, lh.thumbnail, '') as thumbnail,
      COALESCE(
        CASE WHEN cs.channel = 'Unknown' THEN NULL ELSE cs.channel END,
        CASE WHEN lh.channel = 'Unknown' THEN NULL ELSE lh.channel END,
        'Aura Music Offline'
      ) as channel,
      COALESCE(cs.duration, '') as duration,
      COALESCE(lh.duration, 0) as durationSecs
    FROM cached_songs cs
    LEFT JOIN (
      SELECT videoId, title, thumbnail, channel, duration,
             ROW_NUMBER() OVER (PARTITION BY videoId ORDER BY listenedAt DESC) as rn
      FROM listening_history
    ) lh ON cs.videoId = lh.videoId AND lh.rn = 1
    ORDER BY cs.cachedAt DESC
  `);
  const rows = stmt.all() as any[];
  return rows.map(r => {
    // If we don't have a formatted duration in cs.duration, try to format from seconds
    if (!r.duration && r.durationSecs && r.durationSecs > 0) {
      const mm = Math.floor(r.durationSecs / 60);
      const ss = String(r.durationSecs % 60).padStart(2, '0');
      r.duration = `${mm}:${ss}`;
    }
    if (!r.duration) r.duration = '0:00';
    delete r.durationSecs;
    return r;
  });
}

export function getTopChannels(limit: number = 3) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT channel, count(*) as playCount 
    FROM listening_history 
    WHERE skipped = 0 AND channel IS NOT NULL AND channel != 'Unknown Channel'
    GROUP BY channel 
    ORDER BY playCount DESC 
    LIMIT ?
  `);
  return stmt.all(limit) as { channel: string; playCount: number }[];
}

export function getSmartPlaylist(_mood: 'focus' | 'energy' | 'chill') {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT videoId as id, title, thumbnail, channel, duration, count(*) as playCount 
    FROM listening_history 
    WHERE skipped = 0 
    GROUP BY videoId 
    ORDER BY playCount DESC 
    LIMIT 15
  `);
  
  return stmt.all();
}

export function createPlaylist(name: string) {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO playlists (name) VALUES (?)');
  return stmt.run(name).lastInsertRowid;
}

export function getPlaylists() {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM playlists ORDER BY createdAt DESC');
  return stmt.all();
}

export function deletePlaylist(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM playlist_tracks WHERE playlistId = ?').run(id);
  db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
}

export function renamePlaylist(id: number, name: string) {
  const db = getDb();
  const stmt = db.prepare('UPDATE playlists SET name = ? WHERE id = ?');
  stmt.run(name, id);
}

export function addTrackToPlaylist(playlistId: number, track: any) {
  const db = getDb();
  // Get max position
  const posStmt = db.prepare('SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlistId = ?');
  const row = posStmt.get(playlistId) as { maxPos: number } | undefined;
  const nextPos = (row?.maxPos || 0) + 1;

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO playlist_tracks 
    (playlistId, videoId, title, thumbnail, channel, duration, views, position) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    playlistId, 
    track.id, 
    track.title || 'Unknown Title', 
    track.thumbnail || null, 
    track.channel || 'Unknown Channel', 
    track.duration || '0:00',
    track.views || 0,
    nextPos
  );
}

export function removeTrackFromPlaylist(playlistId: number, videoId: string) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM playlist_tracks WHERE playlistId = ? AND videoId = ?');
  stmt.run(playlistId, videoId);
}

export function getPlaylistTracks(playlistId: number) {
  const db = getDb();
  const stmt = db.prepare('SELECT videoId as id, title, thumbnail, channel, duration, views FROM playlist_tracks WHERE playlistId = ? ORDER BY position ASC');
  return stmt.all(playlistId);
}

export function getListeningStats() {
  const db = getDb();
  
  // Total listening time in minutes
  // For new entries we use listenedSeconds, for old ones we use duration but cap it at 10 mins if it looks like a full duration log error
  const totalRow = db.prepare(`
    SELECT SUM(CASE 
      WHEN listenedSeconds > 0 THEN listenedSeconds 
      ELSE (CASE WHEN duration > 600 THEN 300 ELSE duration END)
    END) as totalSecs FROM listening_history WHERE skipped = 0
  `).get() as { totalSecs: number | null };
  const totalMinutes = totalRow.totalSecs ? Math.floor(totalRow.totalSecs / 60) : 0;

  // Total Tracks Played
  const tracksPlayedRow = db.prepare('SELECT COUNT(*) as count FROM listening_history').get() as { count: number };
  const totalTracks = tracksPlayedRow.count;

  // Top Tracks
  const topTracks = db.prepare(`
    SELECT videoId as id, title, channel, thumbnail, COUNT(*) as playCount, 
    SUM(CASE WHEN listenedSeconds > 0 THEN listenedSeconds ELSE duration END) as timeSpent
    FROM listening_history
    WHERE skipped = 0
    GROUP BY videoId
    ORDER BY playCount DESC
    LIMIT 5
  `).all();

  // Top Channels
  const topChannels = db.prepare(`
    SELECT channel, 
           COALESCE(
             (SELECT channelThumbnail FROM listening_history h3 WHERE h3.channel = h.channel AND h3.channelThumbnail NOT NULL LIMIT 1),
             (SELECT thumbnail FROM listening_history h2 WHERE h2.channel = h.channel GROUP BY thumbnail ORDER BY COUNT(*) DESC LIMIT 1)
           ) as thumbnail,
           COUNT(*) as playCount, 
           SUM(CASE WHEN listenedSeconds > 0 THEN listenedSeconds ELSE duration END) as timeSpent
    FROM listening_history h
    WHERE skipped = 0 AND channel IS NOT NULL AND channel != 'Unknown Channel'
    GROUP BY channel
    ORDER BY playCount DESC
    LIMIT 5
  `).all();

  // Determine Persona
  // 1. Check Hour (Night Owl vs Early Bird)
  const hourRow = db.prepare(`
    SELECT strftime('%H', listenedAt) as hour, COUNT(*) as count
    FROM listening_history
    GROUP BY hour
    ORDER BY count DESC
    LIMIT 1
  `).get() as { hour: string; count: number } | undefined;
  
  let persona = "Người yêu nhạc"; // Default: Music Lover
  if (hourRow) {
    const h = parseInt(hourRow.hour);
    if (h >= 23 || h <= 4) persona = "Hệ Cày Đêm"; // Night Owl
    else if (h >= 5 && h <= 8) persona = "Hệ Bình Minh"; // Early Bird
    else if (h >= 13 && h <= 17) persona = "Hệ Focus"; // Focus Master
  }

  // Determine Main Vibe based on titles (Simple heuristic)
  const vibeRow = db.prepare(`
    SELECT vibe, COUNT(*) as count FROM listening_history 
    WHERE vibe IS NOT NULL 
    GROUP BY vibe ORDER BY count DESC LIMIT 1
  `).get() as { vibe: string; count: number } | undefined;
  
  const mainVibe = vibeRow?.vibe || "Chill";

  return { totalMinutes, totalTracks, topTracks, topChannels, persona, mainVibe };
}
export function updateChannelAvatar(channel: string, avatarUrl: string) {
  const db = getDb();
  db.prepare('UPDATE listening_history SET channelThumbnail = ? WHERE channel = ?').run(avatarUrl, channel);
  db.prepare('UPDATE cached_songs SET channelThumbnail = ? WHERE channel = ?').run(avatarUrl, channel);
  db.prepare('UPDATE playlist_tracks SET thumbnail = ? WHERE channel = ?').run(avatarUrl, channel); // For playlists, thumbnail IS often the channel pic
}
export function updateSongMetadata(videoId: string, title?: string, thumbnail?: string, channel?: string) {
  const db = getDb();
  if (title) db.prepare('UPDATE listening_history SET title = ? WHERE videoId = ?').run(title, videoId);
  if (thumbnail) db.prepare('UPDATE listening_history SET thumbnail = ? WHERE videoId = ?').run(thumbnail, videoId);
  if (channel) db.prepare('UPDATE listening_history SET channel = ? WHERE videoId = ?').run(channel, videoId);
  
  // Also update cache if exists
  if (thumbnail) db.prepare('UPDATE cached_songs SET thumbnail = ? WHERE videoId = ?').run(thumbnail, videoId);
  if (title) db.prepare('UPDATE cached_songs SET title = ? WHERE videoId = ?').run(title, videoId);
}
export function getArtistStats(channel: string) {
  const db = getDb();
  const topTracks = db.prepare(`
    SELECT videoId as id, title, thumbnail, COUNT(*) as playCount,
    SUM(CASE WHEN listenedSeconds > 0 THEN listenedSeconds ELSE duration END) as timeSpent
    FROM listening_history
    WHERE channel = ? AND skipped = 0
    GROUP BY videoId
    ORDER BY playCount DESC
    LIMIT 5
  `).all(channel);

  return { topTracks };
}
