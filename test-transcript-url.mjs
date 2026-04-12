import https from 'https';

async function fetchTranscript(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const html = await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
  const match = html.match(/"captions":\s*(\{.*?\})/);
  if (!match) return console.log('No captions match');
  const captions = JSON.parse(match[1]);
  console.log(captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl);
}
fetchTranscript('FN7ALfpGxiI').catch(console.error);
