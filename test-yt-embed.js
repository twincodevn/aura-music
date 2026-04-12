import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ 
      cache: new UniversalCache(false),
      location: 'VN',
      lang: 'vi',
      clientType: 'WEB_EMBEDDED'
  });
  
  try {
     const info = await yt.getInfo('6KO8sVvKejI');
     const format = info.chooseFormat({ type: 'audio', quality: 'best' });
     const streamUrl = format.decipher(yt.session.player);
     console.log('Stream URL:', streamUrl);
  } catch (e) {
     console.log('Error:', e.message);
  }
}
test();
