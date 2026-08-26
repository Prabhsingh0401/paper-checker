"use client";

interface OverlayBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function OverlayBox({ x, y, width, height }: OverlayBoxProps) {
  return (
    <div
      className="absolute border-2 border-accent bg-accent/10 rounded-sm pointer-events-none transition-all duration-200"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${width * 100}%`,
        height: `${height * 100}%`,
      }}
    />
  );
}
