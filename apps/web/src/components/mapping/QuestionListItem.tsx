"use client";

interface QuestionListItemProps {
  number: string;
  text: string;
  status: "answered" | "unanswered" | "needs_review";
  selected?: boolean;
  feedback?: string;
  marks?: number;
  estimated?: boolean;
  onClick: () => void;
}

const statusConfig = {
  answered: { color: "bg-success", label: "Answered" },
  unanswered: { color: "bg-muted", label: "Not answered" },
  needs_review: { color: "bg-warning", label: "Needs review" },
};

export default function QuestionListItem({
  number,
  text,
  status,
  selected,
  feedback,
  marks,
  estimated,
  onClick,
}: QuestionListItemProps) {
  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
        selected
          ? "bg-accent/5 border border-accent/20 shadow-sm"
          : "bg-surface/50 border border-transparent hover:bg-surface hover:border-border-light"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-muted mt-0.5 w-10 shrink-0">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug line-clamp-2">
            {text}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
            <span className="text-[11px] text-muted">{config.label}</span>
            {marks !== undefined && (
              <span className="text-[11px] font-medium text-foreground ml-auto">
                {marks} marks
              </span>
            )}
          </div>
          {feedback && status === "answered" && (
            <p className="text-xs text-muted mt-1.5 leading-relaxed line-clamp-2">
              {feedback}
              {estimated && (
                <span className="text-warning ml-1">(AI-estimated)</span>
              )}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
