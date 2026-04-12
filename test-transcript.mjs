import { Innertube } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create();
  try {
    const info = await yt.getInfo('FN7ALfpGxiI');
    const transcript = await info.getTranscript();
    console.log(JSON.stringify(transcript.transcript.content.body.initial_segments.slice(0, 2), null, 2));
  } catch(e) {
    console.error('Error:', e.message);
  }
}
main();
