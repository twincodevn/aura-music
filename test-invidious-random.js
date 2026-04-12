async function test() {
   const res = await fetch('https://api.invidious.io/instances.json');
   const instances = await res.json();
   const apis = instances.map(i => i[1].uri).filter(u => u);
   for (const api of apis) {
       try {
           const url = `${api}/api/v1/videos/6KO8sVvKejI`;
           const vres = await fetch(url);
           if(vres.ok) {
               const data = await vres.json();
               const format = data.adaptiveFormats?.find(f => f.type?.includes('audio/mp4') || f.type?.includes('m4a'));
               if (format && format.url) {
                   console.log('SUCCESS INVIDIOUS:', api, format.url.substring(0, 50));
                   return;
               }
           }
       } catch(e) {}
   }
}
test();
