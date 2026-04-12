import play from 'play-dl';

async function test() {
  try {
     const info = await play.video_info('https://www.youtube.com/watch?v=6KO8sVvKejI');
     const format = info.format.find(f => f.mimeType && f.mimeType.includes('audio'));
     console.log('Stream URL:', format?.url?.substring(0, 50));
  } catch (e) {
     console.log('Error:', e.message);
  }
}
test();
