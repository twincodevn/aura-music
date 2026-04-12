async function getInvidiousStreamUrl(videoId) {
  try {
     const instances = [
         'https://inv.nadeko.net',
         'https://invidious.private.coffee',
         'https://invidious.asir.dev',
         'https://inv.tux.pizza',
         'https://iv.datura.network',
         'https://inv.thepixora.com'
     ];
     for (const api of instances) {
         try {
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 3000);
             const res = await fetch(`${api}/api/v1/videos/${videoId}`, { signal: controller.signal });
             clearTimeout(timeoutId);
             if (res.ok) {
                 const data = await res.json();
                 const format = data.adaptiveFormats?.find((f) => 
                     f.type?.includes('audio/mp4') || f.type?.includes('m4a') || f.type?.includes('audio')
                 );
                 if (format && format.url) {
                     return format.url;
                 }
             }
         } catch (e) {
             console.log(`Failed: ${api}`);
         }
     }
  } catch(e) {}
  return null;
}
async function test() {
   const res = await getInvidiousStreamUrl('6KO8sVvKejI');
   console.log('Result:', res?.substring(0, 50));
}
test();
