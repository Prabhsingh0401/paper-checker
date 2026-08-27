"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import QuestionList from "@/components/mapping/QuestionList";
import AnswerSheetViewer from "@/components/mapping/AnswerSheetViewer";
import ChangeAnswerSheetDialog from "@/components/common/ChangeAnswerSheetDialog";
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
  return (
    <Suspense fallback={null}>
      <MappingContent />
    </Suspense>
  );
}

function MappingContent() {
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
  const [leftWidth, setLeftWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);
  const [mobileTab, setMobileTab] = useState<"questions" | "answers">("questions");
  const [questionPaperId, setQuestionPaperId] = useState("");
  const [changeSheetOpen, setChangeSheetOpen] = useState(false);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(300, Math.min(700, e.clientX - 300));
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Reset mobile tab when resizing to desktop so panels don't stay hidden
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileTab("questions");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    const storageKey = `paper_checker_session_${sessionId}`;

    async function load() {
      // 1. Try loading cached session data from localStorage first
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.questions && parsed.questions.length > 0) {
            setQuestions(parsed.questions);
            setUnmatchedAnswers(parsed.unmatchedAnswers || []);
            setImageUrl(parsed.imageUrl || "");
            setQuestionPaperId(parsed.questionPaperId || "");
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not parse cached session from localStorage:", e);
      }

      // 2. Fetch fresh session data from server if not cached
      try {
        const mappingData = await getMappingResult(sessionId!);
        let mapped: MappedQuestion[] = (mappingData.questions || []).map(
          (q: { number: string; text: string; maxMarks?: number }) => {
            const match = (mappingData.mappings || []).find(
              (m: { questionNumber: string }) => m.questionNumber === q.number
            );
            return {
              number: q.number,
              text: q.text,
              maxMarks: q.maxMarks || 2,
              answer: match?.answer || null,
              status: (match?.status || "unanswered") as MappedQuestion["status"],
            };
          }
        );

        setQuestions(mapped);
        setUnmatchedAnswers(mappingData.unmatchedAnswers || []);
        setImageUrl(mappingData.imageUrl || "");
        setQuestionPaperId(mappingData.questionPaperId || "");

        try {
          const gradingData = await getGradingResult(sessionId!);
          if (gradingData?.grades) {
            mapped = mapped.map((q) => {
              const g = gradingData.grades.find(
                (gr: { questionNumber: string }) => gr.questionNumber === q.number
              );
              return g
                ? { ...q, marks: g.marks, feedback: g.feedback, estimated: g.estimated }
                : q;
            });
            setQuestions(mapped);
          }
        } catch {
          // Grading optional / pending
        }

        // Save complete analyzed paper result to local storage
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              questions: mapped,
              unmatchedAnswers: mappingData.unmatchedAnswers || [],
              imageUrl: mappingData.imageUrl || "",
              questionPaperId: mappingData.questionPaperId || "",
              savedAt: Date.now(),
            })
          );
        } catch (e) {
          console.warn("Could not save session analysis to localStorage:", e);
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

  const handleSheetUploaded = (newSessionId: string) => {
    setChangeSheetOpen(false);
    router.push(`/loading?session=${newSessionId}`);
  };

  const selected = selectedIndex !== null ? questions[selectedIndex] : null;
  const selectedBoxes = selected?.answer?.boundingBoxes || [];
  const totalPages = imageUrl ? Math.max(1, ...selectedBoxes.map((b) => b.page + 1)) : 1;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-5rem)] lg:min-h-0 w-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading results…</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center min-h-[calc(100vh-5rem)] lg:min-h-0 w-full">
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
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-5rem)] lg:min-h-0 w-full px-6">
        <div className="w-full max-w-sm text-center">
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
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 pt-3 md:p-4 md:pt-4 gap-2 relative select-none">
      {/* Mobile Tab Segment Switcher (matching phone mockup) */}
      <div className="md:hidden flex bg-[#e4e4e7] p-1 rounded-full mb-1 mt-2 shrink-0">
        <button
          onClick={() => setMobileTab("questions")}
          className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
            mobileTab === "questions"
              ? "bg-[#27272a] text-white shadow-md"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Questions
        </button>
        <button
          onClick={() => setMobileTab("answers")}
          className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
            mobileTab === "answers"
              ? "bg-[#27272a] text-white shadow-md"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Answer Sheet
        </button>
      </div>

      {/* Left panel — question list card section */}
      <div
        className={`flex-1 md:flex-none ${
          mobileTab === "questions" ? "flex" : "hidden md:flex"
        } flex-col overflow-hidden bg-[#f9f9fb] border border-gray-200 rounded-2xl p-3 shadow-2xs`}
        style={typeof window !== "undefined" && window.innerWidth >= 768 ? { width: `${leftWidth}px` } : undefined}
      >
        <div className="flex-1 overflow-y-auto pr-1">
          <QuestionList
            questions={questions}
            selectedIndex={selectedIndex}
            onSelect={(i) => {
              if (selectedIndex === i) {
                setSelectedIndex(null);
              } else {
                setSelectedIndex(i);
                const q = questions[i];
                if (q.answer?.boundingBoxes?.length) {
                  setCurrentPage(q.answer.boundingBoxes[0].page);
                }
              }
            }}
          />

          {unmatchedAnswers.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-500 px-1 mb-2">
                Unmatched Answers
              </p>
              {unmatchedAnswers.map((a, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-1.5"
                >
                  <p className="text-xs font-medium text-gray-900">
                    {a.label}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {a.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle Button (Desktop only) */}
      <div className="hidden md:flex items-center justify-center relative group z-20">
        <button
          onMouseDown={() => setIsResizing(true)}
          title="Drag to resize panels"
          aria-label="Resize panels"
          className="w-4 h-16 bg-white hover:bg-gray-100 border border-gray-200 rounded-full shadow-md cursor-col-resize flex items-center justify-center transition-all group-hover:scale-105 active:scale-95"
        >
        </button>
      </div>

      {/* Right panel — answer sheet preview with toolbar */}
      <div
        className={`flex-1 ${
          mobileTab === "answers" ? "flex" : "hidden md:flex"
        } flex-col overflow-hidden min-w-0 md:min-w-[400px]`}
      >
        {imageUrl ? (
          <AnswerSheetViewer
            imageUrl={imageUrl}
            boundingBoxes={selectedBoxes}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            selectedQuestionNumber={selected?.number ? `Q${selected.number}` : "Q2"}
            onChangeAnswerSheet={questionPaperId ? () => setChangeSheetOpen(true) : undefined}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 bg-[#27272a] rounded-2xl">
            No answer sheet image available.
          </div>
        )}
      </div>

      <ChangeAnswerSheetDialog
        open={changeSheetOpen}
        questionPaperId={questionPaperId}
        onClose={() => setChangeSheetOpen(false)}
        onUploaded={handleSheetUploaded}
      />
    </div>
  );
}



