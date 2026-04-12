import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

let cachedPath: string | null = null;

/**
 * Dynamically finds the path to the yt-dlp binary.
 * Checks system PATH first, then common macOS Homebrew locations.
 */
export function getYtdlpPath(): string {
  if (cachedPath) return cachedPath;

  // 1. Try 'which yt-dlp' to find it in the system PATH
  try {
    const whichPath = execSync('which yt-dlp', { encoding: 'utf8' }).trim();
    if (whichPath && fs.existsSync(whichPath)) {
      console.log('[utils] Found yt-dlp via PATH:', whichPath);
      cachedPath = whichPath;
      return whichPath;
    }
  } catch (e) {
    // ignore
  }

  // 2. Check common macOS Homebrew locations (standard and Intel)
  const commonPaths = [
    '/opt/homebrew/bin/yt-dlp',   // Apple Silicon
    '/usr/local/bin/yt-dlp',      // Intel Mac
    '/usr/bin/yt-dlp',
    '/bin/yt-dlp'
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      console.log('[utils] Found yt-dlp at common path:', p);
      cachedPath = p;
      return p;
    }
  }

  // 3. Last resort: just use the name and hope for the best
  console.warn('[utils] yt-dlp not found in common paths or PATH. Falling back to "yt-dlp".');
  return 'yt-dlp';
}
