import { getStreamUrl } from './electron/crawler.ts';

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
