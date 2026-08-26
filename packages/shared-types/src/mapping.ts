import { QuestionStatus } from "./question";
import { Answer } from "./answer";

export interface MappingResult {
  questionNumber: string;
  answer: Answer | null;
  status: QuestionStatus;
}
