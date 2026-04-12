import ytdl from '@distube/ytdl-core';

async function test() {
  console.log('Fetching:', '6KO8sVvKejI');
  try {
     const info = await ytdl.getInfo('6KO8sVvKejI');
     const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
     console.log('Stream URL:', format.url);
  } catch (e) {
     console.log('ytdl error:', e.message);
  }
}
test();
