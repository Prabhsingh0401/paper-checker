"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getExtractionStatus, ApiError } from "@/lib/api-client";

const POLL_MS = 1500;

const stages: Record<string, string> = {
  uploading: "Uploading files…",
  extracting: "Extracting questions and answers…",
  mapping: "Mapping answers to questions…",
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
      setError("No session found. Please upload again.");
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
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted mt-2">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-accent animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Extracting…
        </h1>
        <p className="text-sm text-muted mt-2">
          {stages[stage] || "Processing…"} This may take a moment.
        </p>
        <div className="mt-6 w-48 h-1 rounded-full bg-border-light overflow-hidden mx-auto">
          <div className="h-full bg-accent rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] [animation-fill-mode:forwards]" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
}
