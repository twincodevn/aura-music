import play from 'play-dl';

async function test() {
  try {
     console.log('Fetching stream...');
     const stream = await play.stream('https://www.youtube.com/watch?v=6KO8sVvKejI', {
         discordPlayerCompatibility: true
     });
     console.log('Stream URL:', stream.url);
  } catch (e) {
     console.log('Error:', e.message);
  }
}
test();
