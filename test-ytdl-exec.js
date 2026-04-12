import youtubedl from 'youtube-dl-exec';

async function test() {
  try {
     const url = await youtubedl('https://www.youtube.com/watch?v=6KO8sVvKejI', {
       getUrl: true,
       format: 'm4a/bestaudio/best',
     });
     console.log('URL:', url);
  } catch (e) {
     console.log('Error:', e.message);
  }
}
test();
