"use client";

interface QuestionListItemProps {
  number: string;
  text: string;
  status: "answered" | "unanswered" | "needs_review";
  selected?: boolean;
  feedback?: string;
  marks?: number;
  maxMarks?: number;
  estimated?: boolean;
  subLabel?: string;
  isAccordionOpen?: boolean;
  onClick: () => void;
}

export default function QuestionListItem({
  number,
  text,
  selected,
  feedback,
  marks = 2,
  maxMarks = 2,
  subLabel,
  isAccordionOpen,
  onClick,
}: QuestionListItemProps) {
  // Extract number or subpart letter
  const isSubPart = subLabel || /^[a-z]\.?$/i.test(number);
  const displayMarks = `${marks}/${maxMarks}`;
  const isFullMarks = marks === maxMarks;
  const isOpen = selected || isAccordionOpen;

  return (
    <div
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-[18px] transition-all cursor-pointer border ${
        selected
          ? "bg-white border-2 border-[#f97316] shadow-xs"
          : "bg-white border-gray-200/80 hover:border-gray-300 shadow-2xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Number circle/badge & Text */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              selected
                ? "bg-[#f97316] text-white"
                : "bg-gray-700 text-white"
            }`}
          >
            {isSubPart ? subLabel || number : number}
          </div>
          <p className="text-xs font-medium text-gray-800 leading-relaxed mt-1.5 flex-1 whitespace-pre-wrap">
            {text}
          </p>
        </div>

        {/* Right: Marks pill & Accordion Chevron */}
        <div className="flex items-center gap-1.5 shrink-0 mt-1">
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isFullMarks
                ? "bg-[#eefcf2] text-[#16a34a]"
                : "bg-[#fff1f1] text-[#dc2626]"
            }`}
          >
            {displayMarks}
          </span>
          <button className="text-gray-500 hover:text-gray-700 p-0.5">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* AI Feedback Nested Box when open */}
      {isOpen && feedback && (
        <div className="mt-3 p-3 rounded-xl bg-gray-50/80 border border-gray-200/80 text-xs">
          <div className="font-semibold text-gray-900 mb-1">AI Feedback</div>
          <div className="text-gray-600 leading-relaxed">{feedback}</div>
        </div>
      )}
    </div>
  );
}


