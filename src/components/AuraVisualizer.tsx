import React, { useEffect, useRef } from 'react';

interface AuraVisualizerProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  color?: string;
  count?: number;
  height?: number;
  className?: string;
}

export const AuraVisualizer: React.FC<AuraVisualizerProps> = ({ 
  analyserRef, 
  color = '255, 255, 255', 
  count = 100, 
  height = 40,
  className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyserRef.current?.frequencyBinCount || 0;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationId = requestAnimationFrame(render);
      const analyser = analyserRef.current;
      if (!analyser) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const h = canvas.height;
      const barWidth = width / count;
      
      // Dynamic Wave Drawing
      ctx.beginPath();
      ctx.moveTo(0, h);

      // We only take the first portion of the frequency data (bass/mids) for more visual energy
      const step = Math.floor(bufferLength / count / 2); 
      
      for (let i = 0; i < count; i++) {
        const val = dataArray[i * step] || 0;
        const percent = val / 255;
        const barHeight = percent * h * 0.8;
        
        const x = i * barWidth;
        const y = h - barHeight;

        if (i === 0) ctx.moveTo(x, y);
        else {
          // Quadratic curve for smoothness
          const prevX = (i - 1) * barWidth;
          const prevVal = dataArray[(i - 1) * step] || 0;
          const prevY = h - (prevVal / 255) * h * 0.8;
          ctx.quadraticCurveTo(prevX, prevY, x, y);
        }
      }

      ctx.lineTo(width, h);
      ctx.strokeStyle = `rgba(${color}, 0.5)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ambient Glow Fill
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, `rgba(${color}, 0.2)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [analyserRef, color, count]);

  return (
    <canvas 
      ref={canvasRef}
      width={count * 4}
      height={height}
      className={className}
      style={{ width: '100%', height: `${height}px` }}
    />
  );
};
