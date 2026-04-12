import { getStreamUrl } from './dist-electron/crawler.js';

async function test() {
  console.log('Testing video 6KO8sVvKejI...');
  try {
    const url = await getStreamUrl('6KO8sVvKejI');
    console.log('URL:', url);
  } catch(e) {
    console.error('Failed:', e);
  }
}
test();
