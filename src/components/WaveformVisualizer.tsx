import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  isLoading: boolean;
  themeColor?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  isLoading,
  themeColor = '#00f0ff',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const bars = 28;
      const barWidth = width / bars - 2;

      for (let i = 0; i < bars; i++) {
        let barHeight = 4;

        if (isPlaying) {
          // Dynamic simulated frequency amplitude
          const wave1 = Math.sin(phase + i * 0.4);
          const wave2 = Math.cos(phase * 0.8 + i * 0.2);
          const wave3 = Math.sin(phase * 1.5 + i * 0.7);
          const amp = Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
          barHeight = Math.max(4, amp * (height * 0.82));
        } else if (isLoading) {
          // Scanning pulse wave
          const wave = Math.sin(phase * 2 + i * 0.3);
          barHeight = Math.max(4, Math.abs(wave) * 16);
        }

        const x = i * (barWidth + 2);
        const y = centerY - barHeight / 2;

        ctx.fillStyle = isPlaying ? themeColor : isLoading ? '#94a3b8' : '#334155';
        ctx.shadowColor = isPlaying ? themeColor : 'transparent';
        ctx.shadowBlur = isPlaying ? 6 : 0;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      phase += isPlaying ? 0.12 : 0.05;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isLoading, themeColor]);

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={32}
      className="rounded bg-slate-950/60 border border-slate-800/80 px-1"
    />
  );
};
