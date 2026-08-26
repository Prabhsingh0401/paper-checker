"use client";

import OverlayBox from "./OverlayBox";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface AnswerSheetViewerProps {
  imageUrl: string;
  boundingBoxes: BoundingBox[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function AnswerSheetViewer({
  imageUrl,
  boundingBoxes,
  totalPages,
  currentPage,
  onPageChange,
}: AnswerSheetViewerProps) {
  const pageBoxes = boundingBoxes.filter((b) => b.page === currentPage);

  return (
    <div className="rounded-2xl border border-border-light bg-surface overflow-hidden">
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-light">
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="text-xs text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-muted">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() =>
              onPageChange(Math.min(totalPages - 1, currentPage + 1))
            }
            disabled={currentPage === totalPages - 1}
            className="text-xs text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
      <div className="relative p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Answer sheet"
          className="w-full h-auto rounded-lg"
        />
        {pageBoxes.map((box, i) => (
          <OverlayBox
            key={i}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
          />
        ))}
      </div>
    </div>
  );
}
