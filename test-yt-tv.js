import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ 
      cache: new UniversalCache(false),
      location: 'VN',
      lang: 'vi',
      clientType: 'WEB_REMIX'
  });
  
  try {
     const info = await yt.getInfo('6KO8sVvKejI');
     const format = info.chooseFormat({ type: 'audio', quality: 'best' });
     const streamUrl = format.decipher(yt.session.player);
     console.log('WEB_REMIX (Music) URL:', !!streamUrl);
     return;
  } catch (e) {
     console.log('WEB_REMIX error:', e.message);
  }
}
test();
