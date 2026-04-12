async function test() {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.smnz.de',
    'https://de-muc.piped.video',
    'https://pipedapi.adminforge.de'
  ];
  for (const api of instances) {
     try {
         console.log('Trying', api);
         const res = await fetch(`${api}/streams/6KO8sVvKejI`);
         if (res.ok) {
             const data = await res.json();
             const stream = data.audioStreams?.find(s => s.mimeType?.includes('mp4'));
             if (stream && stream.url) {
                 console.log('Success:', api, stream.url.substring(0, 50));
                 return;
             }
         }
     } catch (e) { console.log('Failed:', api, e.message); }
  }
}
test();
