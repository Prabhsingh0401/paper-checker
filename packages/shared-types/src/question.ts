export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type QuestionStatus = "answered" | "unanswered" | "needs_review";

export interface Question {
  number: string;
  text: string;
  subParts?: string[];
}
