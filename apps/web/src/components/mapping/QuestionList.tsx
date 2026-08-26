"use client";

import QuestionListItem from "./QuestionListItem";

interface Question {
  number: string;
  text: string;
  status: "answered" | "unanswered" | "needs_review";
  feedback?: string;
  marks?: number;
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
  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted">
        No questions extracted yet.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {questions.map((q, i) => (
        <QuestionListItem
          key={q.number}
          number={q.number}
          text={q.text}
          status={q.status}
          selected={selectedIndex === i}
          feedback={q.feedback}
          marks={q.marks}
          estimated={q.estimated}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
