"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AnswerKeyInput from "@/components/upload/AnswerKeyInput";
import { uploadFiles, ApiError } from "@/lib/api-client";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Unsupported file type. Please upload a PDF or image.";
  }
  if (file.size > MAX_SIZE) {
    return "File exceeds 10 MB limit.";
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

function UploadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SimpleUploadCard({
  label,
  highlight,
  file,
  onFileSelect,
  onFileRemove,
  error,
}: {
  label: string;
  highlight: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (file) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white py-5 px-4 cursor-pointer transition-colors ${
          error ? "border-error/40" : "border-gray-200 hover:border-orange-300"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelect(f);
          }}
        />
        <div className="relative w-full rounded-xl bg-gray-50 border border-gray-100 px-5 py-3.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileRemove();
            }}
            aria-label="Remove file"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700"
          >
            <CloseIcon />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-white leading-none tracking-tight">PDF</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white py-8 px-6 cursor-pointer transition-colors ${
        error ? "border-error/40" : "border-gray-200 hover:border-orange-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
        }}
      />
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
        <UploadIcon />
      </div>
      <p className="text-lg font-medium text-gray-900">
        {label} <span className="text-orange-500">{highlight}</span>
      </p>
      <p className="text-xs text-gray-400">Max 10MB</p>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);
  const [answerKey, setAnswerKey] = useState<File | null>(null);
  const [qpError, setQpError] = useState<string>();
  const [asError, setAsError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string>();

  const handleQpSelect = useCallback((file: File) => {
    setGlobalError(undefined);
    const err = validateFile(file);
    if (err) {
      setQpError(err);
      setQuestionPaper(null);
    } else {
      setQpError(undefined);
      setQuestionPaper(file);
    }
  }, []);

  const handleAsSelect = useCallback((file: File) => {
    setGlobalError(undefined);
    const err = validateFile(file);
    if (err) {
      setAsError(err);
      setAnswerSheet(null);
    } else {
      setAsError(undefined);
      setAnswerSheet(file);
    }
  }, []);

  async function handleStart() {
    if (!questionPaper || !answerSheet) return;
    setSubmitting(true);
    setGlobalError(undefined);
    try {
      const { sessionId } = await uploadFiles(
        questionPaper,
        answerSheet,
        answerKey ?? undefined
      );
      router.push(`/loading?session=${sessionId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canStart = questionPaper && answerSheet && !submitting;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 overflow-hidden">
      <div className="w-full max-w-4xl text-center">
        <h1 className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">
          <span>Upload</span>
          <span className="font-semibold text-orange-500 bg-orange-100/70 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl text-xl sm:text-2xl lg:text-4xl">
            Question Paper &amp; Answer Sheets
          </span>
        </h1>
        <p className="text-md sm:text-lg text-gray-700 mt-3 font-semibold">Upload both files to get started</p>

        <div className="mt-5 mb-2">
          <Image
            src="/icons/teacherIcon.png"
            alt="Teacher"
            width={150}
            height={150}
            className="mx-auto"
            priority
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6 rounded-2xl p-4 bg-white/30 max-w-2xl mx-auto">
          <SimpleUploadCard
            label="Upload"
            highlight="Question Paper"
            file={questionPaper}
            onFileSelect={handleQpSelect}
            onFileRemove={() => {
              setQuestionPaper(null);
              setQpError(undefined);
            }}
            error={qpError}
          />
          <SimpleUploadCard
            label="Upload"
            highlight="Answer Sheet"
            file={answerSheet}
            onFileSelect={handleAsSelect}
            onFileRemove={() => {
              setAnswerSheet(null);
              setAsError(undefined);
            }}
            error={asError}
          />
        </div>

        {globalError && (
          <div className="mt-5 px-5 py-3 rounded-xl bg-error/5 border border-error/20 text-sm sm:text-base text-error text-left max-w-4xl mx-auto">
            {globalError}
          </div>
        )}

        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            disabled={!canStart}
            onClick={handleStart}
            className={`flex items-center gap-2 rounded-full px-7 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-medium transition-colors ${
              canStart
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting ? "Starting…" : "Start Mapping"}
            <ArrowIcon />
          </button>
          <p className="text-xs sm:text-sm text-gray-400">
            Once both files are uploaded, you&apos;ll be able to map answers with questions
          </p>
        </div>
      </div>
    </div>
  );
}