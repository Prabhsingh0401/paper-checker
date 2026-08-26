export interface SessionData {
  status: "uploading" | "extracting" | "mapping" | "grading" | "done" | "error";
  questionPaper?: Buffer;
  answerSheet?: Buffer;
  answerKey?: Buffer;
  questions: any[];
  answers: any[];
  mappings: any[];
  unmatchedAnswers: any[];
  grading: any[];
  error?: string;
}

const sessions = new Map<string, SessionData>();

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
