import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { copyFileSync, mkdirSync, rmSync, existsSync } from 'fs'

// Copies the raw preload.cjs (CommonJS, no bundling) into dist-electron
function copyPreloadPlugin() {
  return {
    name: 'copy-preload-cjs',
    closeBundle() {
      try {
        mkdirSync('dist-electron', { recursive: true })
        copyFileSync('electron/preload.cjs', 'dist-electron/preload.cjs')
      } catch (e) {
        console.warn('copy-preload:', e)
      }
    }
  }
}

// Cleans dist-electron before each build to prevent stale hashed crawler files
// (e.g. crawler-HcXexYIH.js, crawler-BaS1WN4S.js, ...) from accumulating and
// bloating the final DMG.
function cleanDistElectronPlugin() {
  return {
    name: 'clean-dist-electron',
    buildStart() {
      try {
        if (existsSync('dist-electron')) {
          rmSync('dist-electron', { recursive: true, force: true })
          console.log('[clean] Removed stale dist-electron/')
        }
      } catch (e) {
        console.warn('clean-dist-electron:', e)
      }
    }
  }
}

const isElectron = process.env.ELECTRON === 'true'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    isElectron && electron([
      {
        entry: 'electron/main.ts',
        vite: {
          plugins: [cleanDistElectronPlugin(), copyPreloadPlugin()],
          build: {
            outDir: 'dist-electron',
            emptyOutDir: true,
            rollupOptions: {
              // All runtime deps are in node_modules inside the asar bundle.
              // Mark them external so Rollup doesn't inline duplicate copies.
              external: [
                'better-sqlite3',
                '@distube/ytdl-core',
                'youtube-dl-exec',
                'youtube-sr',
                'youtube-transcript',
                'youtubei.js',
                'play-dl',
              ]
            }
          }
        }
      },
    ]),
    isElectron && renderer(),
  ].filter(Boolean) as any,
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
