"use client";

import React, { useRef, useState } from "react";

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

export default function ChangeAnswerSheetDialog({
  open,
  questionPaperId,
  onClose,
  onUploaded,
}: {
  open: boolean;
  questionPaperId: string;
  onClose: () => void;
  onUploaded: (sessionId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [dragActive, setDragActive] = useState(false);

  if (!open) return null;

  function reset() {
    setFile(null);
    setError(undefined);
  }

  function selectFile(f: File) {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowed.includes(f.type)) {
      setError("Unsupported file type. Please upload a PDF or image.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File exceeds 10 MB limit.");
      return;
    }
    setError(undefined);
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const { uploadAnswerSheet } = await import("@/lib/api-client");
      const result = await uploadAnswerSheet(file, questionPaperId);
      reset();
      onUploaded(result.sessionId);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Change answer sheet"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <CloseIcon />
        </button>
        <div className="px-8 pt-7 pb-7">
          <h1 className="text-xl font-semibold text-gray-900">Change Answer Sheet</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a new answer sheet for the same question paper.
          </p>

          {file ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              {file.type === "application/pdf" ? (
                <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                  PDF
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                  IMG
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(0)}KB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                aria-label="Remove file"
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  selectFile(f);
                  if (inputRef.current) {
                    inputRef.current.files = e.dataTransfer.files;
                  }
                }
              }}
              className={`mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white py-12 cursor-pointer transition-colors ${
                dragActive
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-300"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) selectFile(f);
                }}
              />
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                <UploadIcon />
              </div>
              <p className="text-base font-medium text-gray-900">Upload new Answer Sheet</p>
              <p className="text-xs text-gray-400">PDF or image, max 10MB</p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-500">{error}</p>
          )}

          <button
            disabled={!file || submitting}
            onClick={handleUpload}
            className={`mt-5 w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-colors ${
              file && !submitting
                ? "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting ? "Uploading…" : "Analyse New Sheet"}
          </button>
        </div>
      </div>
    </div>
  );
}
