"use client";

import { useRef } from "react";

interface UploadCardProps {
  label: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  error?: string;
}

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp,.heic";
const MAX_SIZE = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadCard({
  label,
  file,
  onFileSelect,
  onFileRemove,
  error,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_SIZE) {
      onFileSelect(selected);
      return;
    }
    onFileSelect(selected);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelect(dropped);
  }

  if (file) {
    return (
      <div className="relative rounded-2xl border border-border-light bg-surface p-6 transition-shadow hover:shadow-sm">
        <button
          onClick={onFileRemove}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-muted hover:text-foreground transition-colors"
          aria-label="Remove file"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted mt-0.5">{formatSize(file.size)}</p>
          </div>
        </div>
        {error && <p className="text-xs text-error mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="rounded-2xl border-2 border-dashed border-border hover:border-accent/40 bg-surface/50 hover:bg-accent-light/30 p-8 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer group min-h-[200px]"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
      />
      <div className="w-12 h-12 rounded-2xl bg-foreground/5 group-hover:bg-accent/10 flex items-center justify-center transition-colors">
        <svg className="w-6 h-6 text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted mt-1">PDF, JPG, PNG — Max 10MB</p>
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </button>
  );
}
