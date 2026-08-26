"use client";

import { useEffect, useRef, useState } from "react";

interface CroppedSnippetProps {
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CroppedSnippet({
  imageUrl,
  x,
  y,
  width,
  height,
}: CroppedSnippetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const sx = x * img.width;
      const sy = y * img.height;
      const sw = width * img.width;
      const sh = height * img.height;

      canvas.width = sw * 2;
      canvas.height = sh * 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw * 2, sh * 2);
      setReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl, x, y, width, height]);

  return (
    <div className="rounded-xl border border-border-light overflow-hidden bg-surface">
      <div className="px-3 py-2 border-b border-border-light">
        <span className="text-[11px] font-medium text-muted">
          Zoomed view
        </span>
      </div>
      <div className="p-2">
        {ready ? (
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg"
          />
        ) : (
          <div className="w-full aspect-video bg-surface animate-pulse rounded-lg" />
        )}
      </div>
    </div>
  );
}
