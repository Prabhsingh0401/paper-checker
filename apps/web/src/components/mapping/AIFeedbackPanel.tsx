"use client";

interface AIFeedbackPanelProps {
  feedback: string;
  marks?: number;
  estimated?: boolean;
}

export default function AIFeedbackPanel({
  feedback,
  marks,
  estimated,
}: AIFeedbackPanelProps) {
  return (
    <div className="rounded-xl bg-accent-light border border-accent/10 p-3 mt-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-accent">AI Feedback</span>
        {estimated && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">
            AI-estimated
          </span>
        )}
        {marks !== undefined && (
          <span className="ml-auto text-xs font-semibold text-foreground">
            {marks} marks
          </span>
        )}
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{feedback}</p>
    </div>
  );
}
