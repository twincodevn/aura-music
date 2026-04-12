import { Innertube, UniversalCache } from 'youtubei.js';
// import { getTopChannels } from './db.js';
const getTopChannels = (_limit: number) => []; // Mocked for standalone server

// Silence noisy youtubei.js internal logs
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[YOUTUBEJS]')) return;
  originalWarn(...args);
};
// to avoid re-fetching URLs that are still valid (typically ~4–6h).
interface CachedUrl { url: string; expiresAt: number }
const urlCache = new Map<string, CachedUrl>();

function getCached(videoId: string): string | null {
  const entry = urlCache.get(videoId);
  if (!entry) return null;
  // Expire 5 min early to be safe
  if (Date.now() / 1000 > entry.expiresAt - 300) {
    urlCache.delete(videoId);
    return null;
  }
  console.log('[stream] Cache HIT:', videoId);
  return entry.url;
}

function parseExpiry(url: string): number {
  const m = url.match(/[?&]expire=(\d+)/);
  return m ? parseInt(m[1], 10) : (Date.now() / 1000) + 3600; // default 1h
}

// ─── Music Search via Innertube ───────────────────────────────────
let _ytCache: Innertube | null = null;
async function getYT() {
  if (!_ytCache) {
    _ytCache = await Innertube.create({ 
      cache: new UniversalCache(false),
      location: 'VN',
      lang: 'vi'
    });
  }
  return _ytCache;
}

export async function searchMusic(query: string, _timeframe: 'today' | 'month' | 'year' = 'month') {
  const searchQuery = query || 'trending music 2026';
  console.log('[crawler] Searching:', searchQuery);
  try {
    const yt = await getYT();
    const results = await yt.search(searchQuery, { type: 'video' });
    
    const tracks = results.videos.map((v: any) => {
      const secs = v.duration?.seconds || 0;
      const mm = Math.floor(secs / 60);
      const ss = String(secs % 60).padStart(2, '0');
      
      const thumb = v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;
      
      return {
        id: v.id,
        title: v.title?.text || 'Unknown',
        views: v.view_count?.text ? parseInt(v.view_count.text.replace(/[^0-9]/g, '')) : 0,
        duration: `${mm}:${ss}`,
        thumbnail: thumb,
        channel: v.author?.name || 'Unknown',
        channelThumbnail: v.author?.thumbnails?.[0]?.url || null
      };
    }).filter((t: any) => t.id && t.duration !== '0:00').slice(0, 40);

    console.log(`[crawler] Got ${tracks.length} tracks for: ${searchQuery}`);
    return tracks;
  } catch (error: any) {
    console.error('[crawler] Search error:', error?.message ?? error);
    return [];
  }
}

export async function getTrendingCharts() {
  console.log('[crawler] Fetching Live Trending Charts (VN Music)...');
  try {
    const yt = await getYT();
    const explore = await yt.music.getExplore();
    
    // Find "Charts" or "Bảng xếp hạng" in top_buttons or sections
    let chartItem = explore.sections.find((s: any) => 
      s.title?.toString().toLowerCase().includes('bảng xếp hạng') || 
      s.title?.toString().toLowerCase().includes('charts')
    );

    let tracks: any[] = [];

    if (chartItem && chartItem.contents) {
      tracks = chartItem.contents.map((v: any) => {
        if (!v.id) return null;
        const secs = v.duration?.seconds || 0;
        const mm = Math.floor(secs / 60);
        const ss = String(secs % 60).padStart(2, '0');
        
        return {
          id: v.id,
          title: v.title?.text || v.title?.toString() || 'Unknown',
          views: 0, // Explore results might not have views directly
          duration: `${mm}:${ss}`,
          thumbnail: v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
          channel: v.author?.name || v.subtitle?.toString() || 'Unknown',
          channelThumbnail: v.author?.thumbnails?.[0]?.url || null
        };
      }).filter((t: any) => t !== null);
    }

    if (tracks.length === 0) {
      console.log('[crawler] Explore charts empty, falling back to trending search...');
      return searchMusic('BXH Nhạc Việt Mới Nhất 2026');
    }

    console.log(`[crawler] Successfully scraped ${tracks.length} trending tracks from Explore.`);
    return tracks.slice(0, 40);
  } catch (err: any) {
    console.error('[crawler] Trending Charts error:', err?.message ?? err);
    return searchMusic('BXH Nhạc Việt Mới Nhất 2026');
  }
}

// ─── Lấy bài hát liên quan (Up Next / Related) ───────────
export async function getRelatedTracks(videoId: string) {
  try {
    console.log(`[crawler] Fetching related tracks for: ${videoId}`);
    const yt = await getYT();
    const fullInfo = await yt.getInfo(videoId);
    
    const watchNext = fullInfo.watch_next_feed || [];
    
    const tracks = watchNext.map((v: any) => {
      if (!v.id) return null;
      const secs = v.duration?.seconds || 0;
      const mm = Math.floor(secs / 60);
      const ss = String(secs % 60).padStart(2, '0');
      
      const thumb = v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;
      
      return {
        id: v.id,
        title: v.title?.text || 'Unknown',
        views: v.view_count?.text ? parseInt(v.view_count.text.replace(/[^0-9]/g, '')) : 0,
        duration: `${mm}:${ss}`,
        thumbnail: thumb,
        channel: v.author?.name || 'Unknown',
        channelThumbnail: v.author?.thumbnails?.[0]?.url || null
      };
    }).filter((t: any) => {
      if (!t) return false;
      const parts = t.duration.split(':');
      // Aura 5.7: Continuity Filter (Match Main Search)
      const isTooLong = parts.length > 2 || parseInt(parts[0]) > 15;
      const isMix = t.title.toLowerCase().includes('lofi') || 
                   t.title.toLowerCase().includes('1 hour') ||
                   t.title.toLowerCase().includes('không lời');
      return t.id && t.duration !== '0:00' && t.id !== videoId && !isTooLong && !isMix;
    }).slice(0, 15);

    return tracks;
  } catch (err: any) {
    console.error('[crawler] Related fetch error:', err?.message ?? err);
    return [];
  }
}

// ─── Tìm kiếm nâng cao (Advanced Filter & Sort) ───────────
export async function searchAdvancedMusic(
  query: string,
  filters: { time?: string; sort?: string; limit?: number } = {}
) {
  try {
    const { time = 'any', sort = 'relevance', limit = 30 } = filters;
    let searchQuery = query || 'trending music 2026';
    
    // No more string appending for time - we use native filters now
    
    console.log(`[crawler] Advanced Search: "${searchQuery}" | Sort: ${sort} | Time: ${time}`);
    
    const yt = await getYT();
    const searchOptions: any = { type: 'video' };
    
    // Aura 5.5: Native Filter Mapping
    if (time !== 'any') {
      searchOptions.upload_date = time === 'today' ? 'today' : 
                                 time === 'week' ? 'week' : 
                                 time === 'month' ? 'month' : 
                                 time === 'year' ? 'year' : 'all';
    }
    
    if (sort === 'views') {
      searchOptions.prioritize = 'popularity';
    }

    console.log(`[crawler] Native Search Options:`, searchOptions);
    let results = await yt.search(searchQuery, searchOptions);
    let finalVideos = results.videos;

    const tracks = finalVideos.slice(0, limit).map((v: any) => {
      const secs = v.duration?.seconds || 0;
      const mm = Math.floor(secs / 60);
      const ss = String(secs % 60).padStart(2, '0');
      
      const thumb = v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;
      
      return {
        id: v.id,
        title: v.title?.text || 'Unknown',
        views: v.view_count?.text ? parseInt(v.view_count.text.replace(/[^0-9]/g, '')) : 0,
        duration: `${mm}:${ss}`,
        thumbnail: thumb,
        channel: v.author?.name || 'Unknown',
        channelThumbnail: v.author?.thumbnails?.[0]?.url || null
      };
    }).filter((t: any) => t.id && t.duration !== '0:00');

    return tracks.slice(0, 20);
  } catch (err: any) {
    console.error('[crawler] Advanced search error:', err?.message ?? err);
    return [];
  }
}


// ─── Dynamic Contextual Discovery ──────────────────────────────
export async function getDynamicDiscoveryMix() {
  const currentHour = new Date().getHours();
  let moodKeyword = '';
  let moodLabel = '';

  if (currentHour >= 5 && currentHour < 11) {
    moodKeyword = 'morning acoustic coffee cafe bình minh nhẹ nhàng';
    moodLabel = 'Khởi đầu ngày mới';
  } else if (currentHour >= 11 && currentHour < 17) {
    moodKeyword = 'focus lofi upbeat energy làm việc tập trung';
    moodLabel = 'Năng lượng làm việc';
  } else if (currentHour >= 17 && currentHour < 22) {
    moodKeyword = 'evening chill r&b indie sunset chill nhẹ nhàng chiều tà';
    moodLabel = 'Thư giãn hoàng hôn';
  } else {
    moodKeyword = 'late night deep ambient sad lofi đêm khuya tâm trạng';
    moodLabel = 'Giai điệu đêm khuya';
  }

  // Get user's top channels for personalized touch
  const topChannelsData = getTopChannels(3);
  const channels = topChannelsData.map((c: any) => c.channel);
  
  let personalizedTag = '';
  if (channels.length > 0) {
    // Pick a random favorite channel to seed the discovery
    const randomChannel = channels[Math.floor(Math.random() * channels.length)];
    personalizedTag = randomChannel;
  } else {
    personalizedTag = 'trending vietnamese';
  }

  // The secret sauce: combining the time-of-day mood + user's favorite channel + "mix 2026"
  // Aura 5.4: Tiered Discovery Engine for 100% Reliability
  let tracks: any[] = [];
  
  try {
    // Phase 1: High Relevance (Artist + Mood)
    const combinedQuery = `${personalizedTag} ${moodKeyword} mix 2026`;
    const combinedTracks = await searchMusic(combinedQuery);
    tracks = [...combinedTracks];

    // Phase 2: If we don't have enough, add purely contextual tracks
    if (tracks.length < 15) {
      const moodOnlyQuery = `${moodKeyword} hits 2026`;
      const moodTracks = await searchMusic(moodOnlyQuery);
      tracks = [...tracks, ...moodTracks.filter(t => !tracks.some(prev => prev.id === t.id))];
    }

    // Phase 3: If still sparse, add artist-centric radio tracks
    if (tracks.length < 15 && channels.length > 0) {
      const artistQuery = `${personalizedTag} official music`;
      const artistTracks = await searchMusic(artistQuery);
      tracks = [...tracks, ...artistTracks.filter(t => !tracks.some(prev => prev.id === t.id))];
    }
  } catch (err) {
    console.error('[crawler] Discovery mix phase error:', err);
  }
  
  // Shuffle the results to simulate TikTok random FYP discovery
  for (let i = tracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
  }
  
  // Return a solid set of 15-20 tracks
  return {
    moodLabel,
    seedChannel: personalizedTag,
    tracks: tracks.slice(0, 20)
  };
}

// ─── Stream URL via Invidious (Fallback API) ────────────────────
let lastGoodInstance: string | null = null;
const isFetching = new Set<string>();

async function getInvidiousStreamUrl(videoId: string): Promise<string | null> {
  try {
     const instances = [
         'https://inv.nadeko.net',
         'https://invidious.asir.dev',
         'https://inv.tux.pizza',
         'https://iv.datura.network',
         'https://inv.thepixora.com',
         'https://invidious.private.coffee'
     ];

     // Prioritize the last instance that worked for us
     const sortedInstances = lastGoodInstance 
        ? [lastGoodInstance, ...instances.filter(i => i !== lastGoodInstance)]
        : instances;

     for (const api of sortedInstances) {
         try {
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 2500); // Tighter timeout for fast switching
             const res = await fetch(`${api}/api/v1/videos/${videoId}`, { signal: controller.signal });
             clearTimeout(timeoutId);
             if (res.ok) {
                 const data = await res.json();
                 const format = data.adaptiveFormats?.find((f: any) => 
                     f.type?.includes('audio/mp4') || f.type?.includes('m4a') || f.type?.includes('audio')
                 );
                 if (format && format.url) {
                     lastGoodInstance = api; // Remember success
                     return format.url;
                 }
             }
         } catch (e) {
             // Silence per-instance failures to keep logs clean
         }
     }
  } catch(e) {}
  return null;
}

// ─── Stream URL via yt-dlp (with cache) ───────────────────────
export async function getStreamUrl(videoId: string): Promise<string | null> {
  // Return cached URL if still valid
  const cached = getCached(videoId);
  if (cached) return cached;

  try {
    if (isFetching.has(videoId)) return null; // Avoid logging the same concurrent request twice
    isFetching.add(videoId);

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('[stream] Fetching:', videoId);

    // Aura 6.5: Switching to pure JS streaming (Innertube)
    // Avoids binary path/permission issues in production
    const yt = await getYT();
    const info = await yt.getInfo(videoId);
    
    // Choose best audio-only format (preferably M4A/AAC)
    let format;
    try {
      format = info.chooseFormat({ 
        type: 'audio', 
        quality: 'best',
        format: 'm4a' 
      });
    } catch {
      console.log('[stream] M4A not found, falling back to best available audio format');
      format = info.chooseFormat({ 
        type: 'audio', 
        quality: 'best' 
      });
    }

    if (!format?.url && !format?.signatureCipher) {
      throw new Error('No available signature or url in YouTube format (PO Token blocked)');
    }

    const streamUrl = await format.decipher(yt.session.player);
    if (!streamUrl || typeof streamUrl !== 'string') {
      throw new Error('No suitable stream deciphered from Innertube');
    }

    // Cache with parsed expiry (YouTube URLs usually have &expire=...)
    urlCache.set(videoId, { url: streamUrl, expiresAt: parseExpiry(streamUrl) });
    console.log('[stream] Got Innertube Stream URL:', (streamUrl as any).slice(0, 50) + '...');
    return streamUrl;
  } catch (err: any) {
    console.error('[stream] Innertube streaming error:', err?.message ?? err);
    console.log('[stream] Fetching fallback from Invidious API...');
    
    const fallbackUrl = await getInvidiousStreamUrl(videoId);
    if (fallbackUrl) {
      urlCache.set(videoId, { url: fallbackUrl, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
      console.log(`[stream] Succes via ${lastGoodInstance}`);
      return fallbackUrl;
    }
    
    console.error('[stream] FAILED:', videoId);
    return null;
  } finally {
    isFetching.delete(videoId);
  }
}

// ─── Prefetch (fire-and-forget, populates cache) ────────────────
export function prefetchStreamUrl(videoId: string): void {
  if (getCached(videoId)) return; // already cached
  getStreamUrl(videoId).catch(() => {}); // background, ignore errors
}

// ─── Lyrics via lrclib.net (free, no API key) ───────────────────
export interface LyricLine { time: number; text: string }

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  let offset = 0; // offset in seconds

  for (const raw of lrc.split('\n')) {
    // Check for offset tag: [offset:500] (in ms)
    const offsetMatch = raw.match(/^\[offset:(-?\d+)\]/i);
    if (offsetMatch) {
      offset = parseInt(offsetMatch[1], 10) / 1000;
      continue;
    }

    const m = raw.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/);
    if (m) {
      const mins = parseInt(m[1], 10);
      const secs = parseInt(m[2], 10);
      const ms = parseInt(m[3].padEnd(3, '0'), 10);
      const time = (mins * 60 + secs + ms / 1000) + offset;
      const text = m[4].trim();
      if (text) lines.push({ time, text });
    }
  }
  return lines;
}

// fetchLyrics: accepts title, artist, duration (optional), and videoId (fallback)
export async function fetchLyrics(title: string, artist: string, durationSecs?: number, videoId?: string): Promise<{ synced: boolean; source?: 'official' | 'youtube' | 'none'; lines: LyricLine[] }> {
  const cleanArtist = artist
    .replace(/\s*[-–]\s*Topic$/i, '')
    .replace(/\s*(Official|Music|Records|Channel|Entertainment|MV|Video|VEVO|Productions|Studio).*$/gi, '')
    .trim();

  let cleanTitle = title
    .replace(/\s*[\(\[](official|lyric|music|video|audio|mv|hd|4k|visualizer|lyrics?|prod|feat|ft|exclusive|remix|cover)[\s\w]*[\)\]]/gi, '')
    .trim();

  if (cleanTitle.includes('|') || cleanTitle.includes('-')) {
    const parts = cleanTitle.split(/[|\-]/).map(p => p.trim());
    const possibleTitle = parts.find(p => {
      const pLower = p.toLowerCase();
      const isArtist = pLower.includes(cleanArtist.toLowerCase()) || cleanArtist.toLowerCase().includes(pLower);
      const isMetadata = /\b(official|music|video|mv|hd|4k|audio|lyric)\b/i.test(p);
      return !isArtist && !isMetadata && p.length > 2;
    });
    if (possibleTitle) cleanTitle = possibleTitle;
    else if (parts.length > 0) cleanTitle = parts[0];
  }

  console.log(`[lyrics] Fetch: "${cleanTitle}" by "${cleanArtist}" (Fallback ID: ${videoId})`);

  const matchesArtist = (resultArtist: string) => {
    const r = resultArtist.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const a = cleanArtist.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return r.includes(a) || a.includes(r) || (a.includes('tung') && r.includes('tung'));
  };

  const trySearch = async (queryParams: Record<string, string>, label: string) => {
    try {
      const url = new URL('https://lrclib.net/api/search');
      Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));
      
      const res = await fetch(url.toString(), { headers: { 'User-Agent': 'AuraMusic/1.0' } });
      if (!res.ok) return null;
      
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) return null;

      const artistMatches = results.filter(r => matchesArtist(r.artistName));
      if (artistMatches.length === 0) return null;

      const syncedMatches = artistMatches.filter(r => r.syncedLyrics);
      const plainMatches = artistMatches.filter(r => r.plainLyrics && !r.syncedLyrics);

      const findBest = (list: any[]) => {
        if (list.length === 0) return null;
        if (!durationSecs) return list[0];
        return list.reduce((best, curr) => {
          const bestDelta = Math.abs(best.duration - durationSecs);
          const currDelta = Math.abs(curr.duration - durationSecs);
          return currDelta < bestDelta ? curr : best;
        });
      };

      const match = findBest(syncedMatches) || findBest(plainMatches);
      if (!match) return null;

      console.log(`[lyrics] ${label} match: ${match.trackName} by ${match.artistName}`);
      
      if (match.syncedLyrics) return { synced: true, source: 'official' as const, lines: parseLRC(match.syncedLyrics) };
      if (match.plainLyrics) {
        const lines = match.plainLyrics
          .split('\n')
          .filter((l: string) => l.trim())
          .map((text: string, i: number) => ({ time: i * 4, text: text.trim() }));
        return { synced: false, source: 'official' as const, lines };
      }
      return null;
    } catch (e) {
      console.error(`[lyrics] ${label} error:`, e);
      return null;
    }
  };

  // Strategy 1: Accurate search
  const s1 = await trySearch({ track_name: cleanTitle, artist_name: cleanArtist }, 'S1');
  if (s1) return s1;

  // Strategy 2: Broad query
  const broadTitle = cleanTitle.replace(/\s*(ft|feat|featuring).*$/gi, '').trim();
  const s2 = await trySearch({ q: `${broadTitle} ${cleanArtist}` }, 'S2');
  if (s2) return s2;

  // Strategy 3: Title only
  const s3 = await trySearch({ q: broadTitle }, 'S3');
  if (s3) return s3;

  // Strategy 4: Dash split fallback
  if (title.includes(' - ')) {
    const [p1, p2] = title.split(' - ').map(s => s.trim());
    const s4 = await trySearch({ track_name: p2, artist_name: p1 }, 'S4');
    if (s4) return s4;
  }

  // Final System Fallback: YouTube Transcript via yt-dlp
  if (videoId) {
    console.log(`[lyrics] Trying YouTube Config Fallback: ${videoId}`);
    try {
      const youtubedlModule = await import('youtube-dl-exec');
      const youtubedl = (youtubedlModule as any).default || youtubedlModule;
      
      const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, { 
        dumpJson: true, 
        writeSubs: true, 
        skipDownload: true,
        extractorArgs: 'youtube:player_client=ios,web_embedded',
        forceIpv4: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
      });

      // Prefer vi or en subs, or auto-captions
      const subUrl = info.subtitles?.['vi']?.[0]?.url || 
                     info.subtitles?.['en']?.[0]?.url || 
                     info.automatic_captions?.['vi']?.[0]?.url || 
                     info.automatic_captions?.['en']?.[0]?.url;

      if (subUrl) {
         // SubUrl is usually a json3 format or vtt inside the object. Let's fetch the json3 format explicitly:
         const targetUrl = subUrl.replace(/fmt=[a-z0-9]+/, 'fmt=json3');
         const res = await fetch(targetUrl);
         if (res.ok) {
            const data = await res.json();
            const lines: LyricLine[] = [];
            data.events?.forEach((ev: any) => {
               if (ev.segs && ev.segs.length > 0) {
                 const text = ev.segs.map((s: any) => s.utf8).join('').trim();
                 if (text && text !== '\n') {
                    lines.push({
                      time: ev.tStartMs / 1000,
                      text: text.replace(/\[.*?\]/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
                    });
                 }
               }
            });
            if (lines.length > 0) {
              return { synced: true, source: 'youtube' as const, lines };
            }
         }
      }
    } catch (e: any) {
      if (e?.code !== 'ERR_MODULE_NOT_FOUND') {
        console.error('[lyrics] yt-dlp transcript fetch failed:', e);
      }
    }
  }

  return { synced: false, source: 'none' as const, lines: [] };
}
// ─── Fetch Official Channel Avatar (Robust Multi-step) ──────
export async function fetchArtistAvatar(channelName: string): Promise<string | null> {
  console.log('[crawler] Robust avatar fetch for:', channelName);
  try {
    const yt = await getYT();
    const result = await yt.search(channelName, { type: 'channel' });
    if (result && result.channels && result.channels.length > 0) {
      let avatar = result.channels[0].author?.thumbnails?.[0]?.url || null;
      if (avatar) avatar = avatar.replace(/=s\d+-/, '=s512-');
      return avatar;
    }
    return null;
  } catch (err) {
    console.error('[crawler] Robust avatar fetch error:', err);
    return null;
  }
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    if (!query.trim()) return [];
    
    // Using suggestqueries API with proper UTF-8 buffer handling
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=vi&gl=vn&q=${encodeURIComponent(query)}`;
    
    return new Promise((resolve) => {
      import('https').then(https => {
        https.get(url, (res) => {
          const chunks: any[] = [];
          res.on('data', (chunk) => { chunks.push(chunk); });
          res.on('end', () => {
            try {
              const data = Buffer.concat(chunks).toString('utf8');
              const parsed = JSON.parse(data);
              resolve(parsed[1] || []);
            } catch {
              resolve([]);
            }
          });
        }).on('error', () => {
          resolve([]);
        });
      });
    });
  } catch (err) {
    console.error('[crawler] getSearchSuggestions error:', err);
    return [];
  }
}
