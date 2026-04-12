import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ 
      cache: new UniversalCache(false),
      location: 'VN',
      lang: 'vi'
  });
  const info = await yt.getInfo('6KO8sVvKejI');
  
  try {
     const format = info.chooseFormat({ type: 'audio', quality: 'best' });
     console.log('Format:', JSON.stringify(format, null, 2));
  } catch (e) {
     console.log('Error:', e.message);
  }
}
test();
