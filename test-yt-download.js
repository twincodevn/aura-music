import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ 
      cache: new UniversalCache(false),
      location: 'VN',
      lang: 'vi'
  });
  
  try {
     console.log('getting info...');
     const info = await yt.getInfo('6KO8sVvKejI');
     console.log('Downloading...');
     const stream = await info.download({ type: 'audio', quality: 'best' });
     
     stream.on('data', (chunk) => {
        console.log('Got chunk of size', chunk.length);
        process.exit(0);
     });
     stream.on('error', (e) => {
        console.log('Stream error', e);
     });
  } catch (e) {
     console.log('Error:', e.message);
  }
}
test();
