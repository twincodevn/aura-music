import { Innertube } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create();
  const info = await yt.getBasicInfo('FN7ALfpGxiI');
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  console.log('Stream URL:', format.url);
  console.log('Has signatureCipher?', !!format.signature_cipher);
}

main().catch(console.error);
