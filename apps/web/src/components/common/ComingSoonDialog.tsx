"use client";

import React, { useEffect } from "react";

export default function ComingSoonToast({
  title,
  open,
  onClose,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100]">
      <div className="w-[80vw] sm:w-auto sm:min-w-[320px] sm:max-w-sm flex items-start gap-3 rounded-xl bg-zinc-900 text-white px-4 py-3 shadow-2xl border border-zinc-700/60 animate-[fadeInUp_.2s_ease-out]">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title} — Coming Soon</p>
          <p className="text-xs text-zinc-400">We&apos;re working on it!</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-auto p-1.5 rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
