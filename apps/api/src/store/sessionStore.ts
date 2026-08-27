import { randomUUID } from "crypto";

export interface SessionData {
  status: "uploading" | "extracting" | "mapping" | "grading" | "done" | "error";
  questionPaperPath?: string;
  answerSheetPath?: string;
  answerKeyPath?: string;
  questionPaperMime?: string;
  answerSheetMime?: string;
  questions: { number: string; text: string; subParts?: string[] }[];
  answers: {
    label: string;
    text: string;
    boundingBoxes: { x: number; y: number; width: number; height: number; page: number }[];
    confidence: "high" | "low";
  }[];
  mappings: {
    questionNumber: string;
    answer: {
      label: string;
      text: string;
      boundingBoxes: { x: number; y: number; width: number; height: number; page: number }[];
      confidence: "high" | "low";
    } | null;
    status: "answered" | "unanswered" | "needs_review";
  }[];
  unmatchedAnswers: {
    label: string;
    text: string;
    boundingBoxes: { x: number; y: number; width: number; height: number; page: number }[];
    confidence: "high" | "low";
  }[];
  grading: {
    questionNumber: string;
    marks?: number;
    feedback: string;
    estimated: boolean;
  }[];
  error?: string;
  questionPaperId?: string;
}

export interface QuestionPaperEntry {
  id: string;
  filename: string;
  mime: string;
  questions: { number: string; text: string; maxMarks?: number; subParts?: string[] }[];
}

const sessions = new Map<string, SessionData>();
const questionPapers = new Map<string, QuestionPaperEntry>();

export function generateSessionId(): string {
  return randomUUID();
}

export function createSession(id: string): SessionData {
  const session: SessionData = {
    status: "uploading",
    questions: [],
    answers: [],
    mappings: [],
    unmatchedAnswers: [],
    grading: [],
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): SessionData | undefined {
  return sessions.get(id);
}

export function updateSession(id: string, updates: Partial<SessionData>): void {
  const session = sessions.get(id);
  if (session) Object.assign(session, updates);
}

export function addQuestionPaper(entry: QuestionPaperEntry): void {
  questionPapers.set(entry.id, entry);
}

export function getQuestionPapers(): QuestionPaperEntry[] {
  return Array.from(questionPapers.values());
}

export function getQuestionPaper(id: string): QuestionPaperEntry | undefined {
  return questionPapers.get(id);
}
