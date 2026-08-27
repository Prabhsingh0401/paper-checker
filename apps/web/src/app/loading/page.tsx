"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getExtractionStatus } from "@/lib/api-client";

const POLL_MS = 1500;

const stages: Record<string, string> = {
  uploading: "Uploading files…",
  extracting: "Extracting…",
  mapping: "Mapping answers…",
  grading: "Grading responses…",
  done: "Done",
};

export default function LoadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [stage, setStage] = useState("uploading");
  const [error, setError] = useState<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!sessionId) {
      queueMicrotask(() => setError("No session found. Please upload again."));
      return;
    }

    async function poll() {
      try {
        const data = await getExtractionStatus(sessionId!);
        setStage(data.status);

        if (data.status === "done") {
          clearInterval(timer.current);
          router.replace(`/mapping?session=${sessionId}`);
        } else if (data.status === "error") {
          clearInterval(timer.current);
          setError("Extraction failed. Please try uploading again.");
        }
      } catch {
        clearInterval(timer.current);
        setError("Lost connection to the server. Please try again.");
      }
    }

    poll();
    timer.current = setInterval(poll, POLL_MS);
    return () => clearInterval(timer.current);
  }, [sessionId, router]);

  function handleRetry() {
    router.replace("/");
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-5rem)] lg:min-h-0 w-full px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] lg:min-h-0 w-full">
      <div className="text-center px-6 py-12 bg-white rounded-2xl shadow-2xs">
        <Image
          src="/icons/extractingIcon.png"
          alt=""
          width={80}
          height={80}
          className="mx-auto mb-6 animate-pulse"
        />
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight animate-pulse">
          {stages[stage] || "Processing…"}
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          This may take a while.
        </p>
      </div>
    </div>
  );
}
