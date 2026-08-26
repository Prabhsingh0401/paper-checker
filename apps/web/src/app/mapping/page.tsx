"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import QuestionList from "@/components/mapping/QuestionList";
import AnswerSheetViewer from "@/components/mapping/AnswerSheetViewer";
import CroppedSnippet from "@/components/mapping/CroppedSnippet";
import AIFeedbackPanel from "@/components/mapping/AIFeedbackPanel";
import { getMappingResult, getGradingResult, ApiError } from "@/lib/api-client";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface Answer {
  label: string;
  text: string;
  boundingBoxes: BoundingBox[];
  confidence: "high" | "low";
}

interface MappedQuestion {
  number: string;
  text: string;
  status: "answered" | "unanswered" | "needs_review";
  answer: Answer | null;
  feedback?: string;
  marks?: number;
  estimated?: boolean;
}

export default function MappingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [questions, setQuestions] = useState<MappedQuestion[]>([]);
  const [unmatchedAnswers, setUnmatchedAnswers] = useState<Answer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const mappingData = await getMappingResult(sessionId!);
        const mapped: MappedQuestion[] = (mappingData.questions || []).map(
          (q: { number: string; text: string }) => {
            const match = (mappingData.mappings || []).find(
              (m: { number: string }) => m.number === q.number
            );
            return {
              number: q.number,
              text: q.text,
              answer: match?.answer || null,
              status: (match?.status || "unanswered") as MappedQuestion["status"],
            };
          }
        );
        setQuestions(mapped);
        setUnmatchedAnswers(mappingData.unmatchedAnswers || []);
        setImageUrl(mappingData.imageUrl || "");

        try {
          const gradingData = await getGradingResult(sessionId!);
          if (gradingData?.grades) {
            setQuestions((prev) =>
              prev.map((q) => {
                const g = gradingData.grades.find(
                  (gr: { questionNumber: string }) => gr.questionNumber === q.number
                );
                return g
                  ? { ...q, marks: g.marks, feedback: g.feedback, estimated: g.estimated }
                  : q;
              })
            );
          }
        } catch {
          // Grading not available yet — not an error
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not load results. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionId]);

  const selected = selectedIndex !== null ? questions[selectedIndex] : null;
  const selectedBoxes = selected?.answer?.boundingBoxes || [];
  const totalPages = imageUrl ? Math.max(1, ...selectedBoxes.map((b) => b.page + 1)) : 1;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading results…</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Start Analysing Papers</h1>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          Upload a question paper and answer sheet to get AI-powered analysis, mapping, and grading.
        </p>
        <button
          onClick={() => router.replace("/")}
          className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          Upload Papers
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm text-center px-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Could not load results</h1>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <button
            onClick={() => router.replace("/")}
            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel — question list */}
      <div className="w-[380px] shrink-0 border-r border-border-light flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-border-light">
          <h2 className="text-sm font-semibold text-foreground">
            Questions{" "}
            <span className="text-muted font-normal">({questions.length})</span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <QuestionList
            questions={questions}
            selectedIndex={selectedIndex}
            onSelect={(i) => {
              setSelectedIndex(i);
              const q = questions[i];
              if (q.answer?.boundingBoxes?.length) {
                setCurrentPage(q.answer.boundingBoxes[0].page);
              }
            }}
          />

          {unmatchedAnswers.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-muted px-1 mb-2">
                Unmatched Answers
              </p>
              {unmatchedAnswers.map((a, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-warning/5 border border-warning/10 p-3 mb-1.5"
                >
                  <p className="text-xs font-medium text-foreground">
                    {a.label}
                  </p>
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {a.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — answer sheet + snippet */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {imageUrl ? (
            <div className="max-w-3xl mx-auto space-y-4">
              <AnswerSheetViewer
                imageUrl={imageUrl}
                boundingBoxes={selectedBoxes}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />

              {selected?.answer && (
                <CroppedSnippet
                  imageUrl={imageUrl}
                  x={selected.answer.boundingBoxes[0]?.x ?? 0}
                  y={selected.answer.boundingBoxes[0]?.y ?? 0}
                  width={selected.answer.boundingBoxes[0]?.width ?? 0}
                  height={selected.answer.boundingBoxes[0]?.height ?? 0}
                />
              )}

              {selected?.answer && selected.feedback && (
                <AIFeedbackPanel
                  feedback={selected.feedback}
                  marks={selected.marks}
                  estimated={selected.estimated}
                />
              )}

              {selected?.answer?.confidence === "low" && (
                <div className="px-4 py-3 rounded-xl bg-warning/5 border border-warning/20 text-sm text-warning flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                  This answer may need manual review — handwriting was hard to read.
                </div>
              )}

              {selected && !selected.answer && (
                <div className="text-center py-12 text-sm text-muted">
                  No answer mapped to this question.
                </div>
              )}

              {!selected && (
                <div className="text-center py-12 text-sm text-muted">
                  Select a question to view its answer.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted">
              No answer sheet image available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
