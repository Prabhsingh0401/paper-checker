export interface GradingResult {
  questionNumber: string;
  marks?: number;
  correct: boolean;
  feedback: string;
  estimated: boolean;
}
