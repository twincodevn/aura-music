import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ 
      cache: new UniversalCache(false),
      location: 'VN',
      lang: 'vi',
      generate_session_locally: true,
      clientType: 'IOS'
  });
  
  try {
     const info = await yt.getInfo('6KO8sVvKejI');
     const format = info.chooseFormat({ type: 'audio', quality: 'best' });
     const streamUrl = format.decipher(yt.session.player);
     console.log('Stream:', streamUrl);
     return;
  } catch (e) {
     console.log('Error:', e.message);
  }
}
test();
