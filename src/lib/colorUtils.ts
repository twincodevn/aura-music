/**
 * Extracts a dominant ambient color pair from an image URL using HTML Canvas.
 * Lightweight, zero-dependency alternative to color-thief.
 */
export async function extractDominantColor(imageUrl: string): Promise<{ primary: string; secondary: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Try to bypass CORS for canvas
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(null);

      // Downsample heavily for fast performance and natural averaging
      canvas.width = 10;
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);
      
      try {
        const data = ctx.getImageData(0, 0, 10, 10).data;
        let r = 0, g = 0, b = 0;
        let maxR = 0, maxG = 0, maxB = 0; // Track max for vibrancy
        let count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; // Skip precise transparency
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];

          r += pr;
          g += pg;
          b += pb;
          
          // Heuristic for finding a "vibrant" pixel
          if (pr + pg + pb > maxR + maxG + maxB) {
            maxR = pr; maxG = pg; maxB = pb;
          }
          
          count++;
        }
        
        if (count === 0) return resolve(null);
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        // Ensure the glow isn't pure black/dim
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (luminance < 0.2) {
          r = Math.min(255, r + 50);
          g = Math.min(255, g + 50);
          b = Math.min(255, b + 50);
        }

        // Secondary color for gradient: slightly shifted hue (analogous pseudo-shift)
        const secR = Math.max(0, r - 30);
        const secG = Math.min(255, g + 40);
        const secB = Math.min(255, Math.floor(b * 1.2));

        resolve({
          primary: `${r}, ${g}, ${b}`,
          secondary: `${secR}, ${secG}, ${secB}`
        });
      } catch (err) {
        // Tainted canvas due to strict CORS. Fallback safely to null.
        console.warn('[colorUtils] Canvas tainted or error:', err);
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
