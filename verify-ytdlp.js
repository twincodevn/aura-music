import { getYtdlpPath } from './electron/utils.js';

try {
  const path = getYtdlpPath();
  console.log('Detected yt-dlp path:', path);
  if (path.includes('yt-dlp')) {
    console.log('SUCCESS: yt-dlp path detected correctly.');
  } else {
    console.error('FAILURE: Unexpected path detected.');
  }
} catch (error) {
  console.error('ERROR during verification:', error);
}
