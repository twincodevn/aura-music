import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const clients = ['TV', 'TV_EMBEDDED', 'WEB_KIDS', 'ANDROID', 'ANDROID_MUSIC'];
  
  for (const clientType of clients) {
      try {
          const yt = await Innertube.create({ 
              cache: new UniversalCache(false),
              clientType: clientType,
              generate_session_locally: true
          });
          const info = await yt.getInfo('6KO8sVvKejI');
          const format = info.chooseFormat({ type: 'audio', quality: 'best' });
          if(format && (format.url || format.signatureCipher)) {
              console.log(clientType, 'SUCCESS', !!format.url, !!format.signatureCipher);
              return;
          } else {
              console.log(clientType, 'No URL or signature');
          }
      } catch (e) {
          console.log(clientType, 'Error:', e.message);
      }
  }
}
test();
