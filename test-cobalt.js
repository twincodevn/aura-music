async function test() {
  const url = 'https://www.youtube.com/watch?v=6KO8sVvKejI';
  const res = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
         url: url,
         vQuality: 'audio',
         isAudioOnly: true,
         youtubeVideoCodec: 'h264'
      })
  });
  const data = await res.json();
  console.log(data);
}
test();
