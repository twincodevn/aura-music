import { Innertube } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create();
  try {
    const stream = await yt.download('FN7ALfpGxiI', { type: 'audio', quality: 'best' });
    console.log('Stream resolved:', stream != null);
  } catch (e) {
    console.error('Download error:', e);
  }
}
main();
