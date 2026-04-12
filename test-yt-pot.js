import { Innertube, UniversalCache } from 'youtubei.js';
import { generatePoToken } from 'youtubei.js';

async function test() {
  console.log('Testing po token...');
  try {
     const po = await generatePoToken();
     console.log('Generated PO Token:', po);
  } catch (e) {
     console.log('Warning:', e.message);
  }
}
test();
