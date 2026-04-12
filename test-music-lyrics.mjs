import { Innertube } from 'youtubei.js';
async function main() {
  const yt = await Innertube.create();
  try {
    const info = await yt.music.getInfo('FN7ALfpGxiI');
    const lyrics = await info.getLyrics();
    console.log(lyrics ? lyrics.description.text.slice(0, 100) : 'No lyrics');
  } catch(e) { console.error('Error:', e.message); }
}
main();
