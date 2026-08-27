"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

export default function ExamsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<
    { id: string; savedAt: number; questionCount: number; answeredCount: number }[]
  >([]);

  useEffect(() => {
    try {
      const items: { id: string; savedAt: number; questionCount: number; answeredCount: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("paper_checker_session_")) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            const id = key.replace("paper_checker_session_", "");
            const questions: unknown[] = data.questions || [];
            const answeredCount = questions.filter((q: unknown) => {
              const item = q as { status?: string; answer?: unknown };
              return item.status === "answered" || item.answer;
            }).length;
            items.push({
              id,
              savedAt: data.savedAt || Date.now(),
              questionCount: questions.length,
              answeredCount,
            });
          }
        }
      }
      items.sort((a, b) => b.savedAt - a.savedAt);
      queueMicrotask(() => setSessions(items));
    } catch (e) {
      console.warn("Could not read stored exam sessions:", e);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto min-h-0 w-full">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Analyzed Exam Papers</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and re-examine your previously checked exam papers and AI feedback.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors shadow-2xs whitespace-nowrap shrink-0 w-fit"
          >
            <span>+ Check New Paper</span>
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4 text-orange-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">No Exam Papers Analyzed Yet</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Upload a question paper and student answer sheet to see automated mappings and AI-powered feedback here.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-5 px-6 py-2.5 rounded-full bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors shadow-2xs"
            >
              Upload Papers Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                onClick={() => router.push(`/mapping?session=${session.id}`)}
                className="group bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                      Exam #{sessions.length - index}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(session.savedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                    Class X Social Studies Paper #{sessions.length - index}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {session.questionCount} Questions extracted • {session.answeredCount} Answered
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Analyzed at {new Date(session.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-orange-500">
                  <span>View Analysis &amp; Feedback</span>
                  <ArrowIcon />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

