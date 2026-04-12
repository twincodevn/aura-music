async function test() {
  const res = await fetch('https://www.youtube.com/watch?v=6KO8sVvKejI');
  const html = await res.text();
  const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (match) {
     const data = JSON.parse(match[1]);
     const formats = data.streamingData?.adaptiveFormats;
     console.log('Found adaptiveFormats:', formats?.length);
     if (formats?.length > 0) {
        const f = formats.find(x => x.mimeType.includes('audio'));
        console.log('Audio format URL:', !!f.url, 'Signature:', !!f.signatureCipher);
     }
  } else {
     console.log('No ytInitialPlayerResponse found');
  }
}
test();
