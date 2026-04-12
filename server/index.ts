import express from 'express';
import cors from 'cors';
import { 
  searchMusic, 
  searchAdvancedMusic, 
  getSearchSuggestions, 
  getRelatedTracks, 
  getStreamUrl, 
  prefetchStreamUrl, 
  fetchLyrics, 
  getDynamicDiscoveryMix, 
  getTrendingCharts 
} from './crawler.js';

import { Readable } from 'stream';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/search', async (req, res) => {
  const query = req.query.q as string;
  const isAdvanced = req.query.advanced === 'true';
  try {
    const results = isAdvanced ? await searchAdvancedMusic(query) : await searchMusic(query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/suggestions', async (req, res) => {
  const query = req.query.q as string;
  try {
    const results = await getSearchSuggestions(query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    const charts = await getTrendingCharts();
    res.json(charts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/related/:id', async (req, res) => {
  try {
    const tracks = await getRelatedTracks(req.params.id);
    res.json(tracks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lyrics/:id', async (req, res) => {
  try {
    const title = req.query.title as string || '';
    const artist = req.query.artist as string || '';
    const duration = req.query.duration ? parseInt(req.query.duration as string, 10) : undefined;
    const lyrics = await fetchLyrics(title, artist, duration, req.params.id);
    res.json(lyrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/discovery', async (req, res) => {
  try {
    const mix = await getDynamicDiscoveryMix();
    res.json(mix);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/prefetch/:id', (req, res) => {
  prefetchStreamUrl(req.params.id);
  res.sendStatus(200);
});

// Stream endpoint to replace `ytstream://`
app.get('/api/stream/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
    const streamUrl = await getStreamUrl(videoId);
    if (!streamUrl) {
      return res.status(404).send('Not Found');
    }

    // Aura 6.6: Audio Proxy Engine (Bypasses IP-binding & CORS)
    // Redirects (302) often fail on mobile because YouTube URLs are bound to the server's IP.
    // Proxying the bytes ensures the music plays on any device anywhere.
    
    const headers: Record<string, string> = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
    };
    
    // Forward Range header for seeking support on Mobile Safari
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await fetch(streamUrl, { headers });
    
    // Forward essential headers
    res.status(response.status);
    if (response.headers.get('content-type')) res.set('Content-Type', response.headers.get('content-type')!);
    if (response.headers.get('content-length')) res.set('Content-Length', response.headers.get('content-length')!);
    if (response.headers.get('content-range')) res.set('Content-Range', response.headers.get('content-range')!);
    res.set('Accept-Ranges', 'bytes');

    if (!response.body) {
      return res.status(500).send('Empty stream');
    }

    // Pipe the stream to response efficiently
    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.status(500).send('Empty stream');
    }

  } catch (err) {
    console.error(`[server] Stream error for ${videoId}:`, err);
    res.status(500).send('Stream Proxy Error');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Aura Web] Backend API listening at http://0.0.0.0:${PORT}`);
});
