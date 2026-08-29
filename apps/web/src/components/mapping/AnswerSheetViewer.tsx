"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

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
  selectedQuestionNumber?: string;
  onChangeAnswerSheet?: () => void;
}

function PdfRenderer({
  url,
  boundingBoxes,
  currentPage,
  zoomLevel,
  questionNumber,
  onRatio,
}: {
  url: string;
  boundingBoxes: BoundingBox[];
  currentPage: number;
  zoomLevel: number;
  questionNumber?: string;
  onRatio?: (ratio: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<unknown>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load PDF once
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const pdf = await pdfjsLib.getDocument(url).promise;
      if (!cancelled) {
        pdfRef.current = pdf;
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Render current page
  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return;
    let cancelled = false;

    async function render() {
      const pdf = pdfRef.current as { getPage: (n: number) => Promise<unknown> };
      if (!pdf) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = (await pdf.getPage(currentPage + 1)) as {
        getViewport: (opts: { scale: number }) => { width: number; height: number };
        render: (params: unknown) => { promise: Promise<void>; cancel: () => void };
      };
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const scale = (zoomLevel / 100) * 1.5;
      const viewport = page.getViewport({ scale });
      onRatio?.(viewport.width / viewport.height);
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (e: unknown) {
        const err = e as { name?: string };
        if (err?.name === "RenderingCancelledException") return;
      }

      if (cancelled) return;

      // Draw bounding boxes
      const pageBoxes = boundingBoxes.filter((b) => b.page === currentPage);
      for (const box of pageBoxes) {
        const bx = box.x * viewport.width;
        const by = box.y * viewport.height;
        const bw = box.width * viewport.width;
        const bh = box.height * viewport.height;

        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = "rgba(34, 197, 94, 0.05)";
        ctx.fillRect(bx, by, bw, bh);

        // Question number label above the box
        if (questionNumber) {
          const label = questionNumber.startsWith("Q")
            ? questionNumber
            : `Q${questionNumber}`;
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          const labelWidth = ctx.measureText(label).width;
          const labelHeight = 18;
          const labelX = bx;
          const labelY = by - labelHeight;
          ctx.fillStyle = "#16a34a";
          ctx.fillRect(labelX, labelY, labelWidth + 8, labelHeight);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(label, labelX + 4, labelY + 13);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [currentPage, boundingBoxes, loading, zoomLevel, questionNumber, onRatio]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

export default function AnswerSheetViewer({
  imageUrl,
  boundingBoxes,
  totalPages,
  currentPage,
  onPageChange,
  selectedQuestionNumber = "Q2",
  onChangeAnswerSheet,
}: AnswerSheetViewerProps) {
  const isPdf = imageUrl.toLowerCase().endsWith(".pdf");
  const [zoomLevel, setZoomLevel] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null);
  const [pageRatio, setPageRatio] = useState<number | null>(null);
  const targetScrollRef = useRef<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setBox({ w: rect.width, h: rect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => setNatSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  const onPdfRatio = useCallback((ratio: number) => setPageRatio(ratio), []);

  const zoom = zoomLevel / 100;
  const displaySize = useMemo(() => {
    if (!box) return null;
    const ratio = natSize ? natSize.w / natSize.h : (pageRatio ?? 1);
    const availW = Math.max(1, box.w);
    const availH = Math.max(1, box.h);
    let h = availH;
    let w = h * ratio;
    if (w > availW) {
      w = availW;
      h = w / ratio;
    }
    return { w: w * zoom, h: h * zoom };
  }, [box, natSize, pageRatio, zoom]);

  function applyZoom(delta: number) {
    const el = containerRef.current;
    const next = Math.max(50, Math.min(200, zoomLevel + delta));
    if (next === zoomLevel) return;
    if (el) {
      // Scale around the viewport center so the sheet area under the center
      // stays put while zooming in/out.
      const k = next / zoomLevel;
      targetScrollRef.current = {
        left: el.scrollLeft * k + (el.clientWidth / 2) * (k - 1),
        top: el.scrollTop * k + (el.clientHeight / 2) * (k - 1),
      };
    }
    setZoomLevel(next);
  }

  // Apply the center-anchored scroll position once the new zoom size renders
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !targetScrollRef.current) return;
    el.scrollLeft = targetScrollRef.current.left;
    el.scrollTop = targetScrollRef.current.top;
    targetScrollRef.current = null;
  }, [displaySize]);

  return (
    <div className="flex flex-col h-full bg-[#27272a] rounded-2xl overflow-hidden text-white shadow-xl">
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between shrink-0 gap-2 px-4 py-3 bg-[#27272a] border-b border-zinc-700/60">
        <div className="hidden sm:block text-sm font-medium text-zinc-200 shrink-0 whitespace-nowrap">Answer Sheet</div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto">
          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 bg-[#3f3f46] px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-200 whitespace-nowrap shrink-0">
            <button
              onClick={() => applyZoom(-10)}
              className="hover:text-white px-1"
            >
              -
            </button>
            <span>{zoomLevel}%</span>
            <button
              onClick={() => applyZoom(10)}
              className="hover:text-white px-1"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onChangeAnswerSheet && (
              <button
                onClick={onChangeAnswerSheet}
                className="flex items-center gap-1.5 bg-[#3f3f46] px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors whitespace-nowrap shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span className="hidden sm:inline">Change Answer Sheet</span>
              </button>
            )}

            {/* Page nav */}
            <div className="flex items-center gap-1 bg-[#3f3f46] px-2 py-1 rounded-lg text-xs font-medium text-zinc-200 whitespace-nowrap shrink-0">
              <button
                onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="hover:text-white disabled:opacity-40 px-1"
              >
                ‹
              </button>
              <span>
                Page {currentPage + 1} of {totalPages || 4}
              </span>
              <button
                onClick={() => onPageChange(Math.min((totalPages || 4) - 1, currentPage + 1))}
                disabled={currentPage === (totalPages || 4) - 1}
                className="hover:text-white disabled:opacity-40 px-1"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Sheet Image / PDF Canvas Container */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-[#18181b] p-4 flex">
        <div
          className="relative shadow-2xl bg-white transition-all duration-200 m-auto"
          style={
            displaySize
              ? { width: displaySize.w, height: displaySize.h }
              : { width: `${zoomLevel}%`, maxWidth: "100%" }
          }
        >
          {isPdf ? (
            <PdfRenderer
              url={imageUrl}
              boundingBoxes={boundingBoxes}
              currentPage={currentPage}
              zoomLevel={zoomLevel}
              questionNumber={selectedQuestionNumber}
              onRatio={onPdfRatio}
            />
          ) : (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Answer sheet"
                className="w-full h-full object-contain block"
              />

              {/* Bounding box overlays */}
              {boundingBoxes
                .filter((b) => b.page === currentPage)
                .map((box, i) => (
                  <div
                    key={i}
                    className="absolute border-2 border-green-500 bg-green-500/10 rounded-sm pointer-events-none"
                    style={{
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${box.width * 100}%`,
                      height: `${box.height * 100}%`,
                    }}
                  >
                    {/* Green Q Tag Badge on top-left of box */}
                    <div className="absolute -top-3 left-0 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-t-sm shadow">
                      {selectedQuestionNumber.startsWith("Q")
                        ? selectedQuestionNumber
                        : `Q${selectedQuestionNumber}`}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

