"use client";

import { useState } from "react";
import QuestionListItem from "./QuestionListItem";

interface Question {
  number: string;
  text: string;
  status: "answered" | "unanswered" | "needs_review";
  feedback?: string;
  marks?: number;
  maxMarks?: number;
  estimated?: boolean;
}

interface QuestionListProps {
  questions: Question[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export default function QuestionList({
  questions,
  selectedIndex,
  onSelect,
}: QuestionListProps) {
  const [expandAll, setExpandAll] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-gray-500">
        No questions extracted yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1 pb-3">
        <h2 className="text-xs font-semibold text-gray-800">
          Extracted Questions (from question paper)
        </h2>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="text-xs font-medium text-gray-700 bg-white border border-gray-300 px-3 py-1 rounded-full shadow-2xs hover:bg-gray-50 transition-colors"
        >
          {expandAll ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5 overflow-y-auto pr-1">
        {questions.map((q, i) => (
          <QuestionListItem
            key={q.number}
            number={q.number}
            text={q.text}
            status={q.status}
            selected={selectedIndex === i}
            feedback={q.feedback}
            marks={q.marks ?? 2}
            maxMarks={q.maxMarks ?? 2}
            estimated={q.estimated}
            isAccordionOpen={expandAll}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>
    </div>
  );
}

