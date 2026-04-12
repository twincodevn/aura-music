async function test() {
  try {
     const instancesRes = await fetch('https://raw.githubusercontent.com/TeamPiped/Piped-Instances/main/instances.json');
     const instancesArray = await instancesRes.json();
     const apis = instancesArray.filter(i => i.api_url && i.up_to_date).map(i => i.api_url);
     console.log(`Found ${apis.length} API instances.`);
     
     for (const api of apis) {
         try {
             const res = await fetch(`${api}/streams/6KO8sVvKejI`);
             if (res.ok) {
                 const data = await res.json();
                 const stream = data.audioStreams?.find(s => s.mimeType?.includes('mp4'));
                 if (stream && stream.url) {
                     console.log('SUCCESS from:', api);
                     console.log('URL:', stream.url.substring(0, 80));
                     return;
                 }
             }
         } catch(e) {}
     }
  } catch (e) { console.log(e); }
}
test();
