const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, init);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(
        body?.error || `Request failed (${res.status})`,
        res.status
      );
    }
    return res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Unable to reach the server. Please try again.");
  }
}

export function uploadFiles(
  questionPaper: File,
  answerSheet: File,
  answerKey?: File
): Promise<{ sessionId: string }> {
  const form = new FormData();
  form.append("questionPaper", questionPaper);
  form.append("answerSheet", answerSheet);
  if (answerKey) form.append("answerKey", answerKey);
  return request("/api/upload", { method: "POST", body: form });
}

export function getExtractionStatus(sessionId: string) {
  return request<{ status: string; progress?: number }>(
    `/api/status/${sessionId}`
  );
}

interface MappingData {
  questions: { number: string; text: string }[];
  mappings: {
    questionNumber: string;
    answer: {
      label: string;
      text: string;
      boundingBoxes: {
        x: number;
        y: number;
        width: number;
        height: number;
        page: number;
      }[];
      confidence: "high" | "low";
    } | null;
    status: "answered" | "unanswered" | "needs_review";
  }[];
  unmatchedAnswers: {
    label: string;
    text: string;
    boundingBoxes: {
      x: number;
      y: number;
      width: number;
      height: number;
      page: number;
    }[];
    confidence: "high" | "low";
  }[];
  imageUrl: string;
  questionPaperUrl?: string;
  questionPaperId?: string;
}

interface GradingData {
  grades: {
    questionNumber: string;
    marks?: number;
    feedback: string;
    estimated: boolean;
  }[];
}

export function getMappingResult(sessionId: string) {
  return request<MappingData>(`/api/mapping/${sessionId}`);
}

export function getGradingResult(sessionId: string) {
  return request<GradingData>(`/api/grading/${sessionId}`);
}

export function getQuestionPapers() {
  return request<{ questionPapers: { id: string; filename: string; questionCount: number }[] }>(
    "/api/upload/question-papers"
  );
}

export function uploadAnswerSheet(answerSheet: File, questionPaperId: string) {
  const form = new FormData();
  form.append("answerSheet", answerSheet);
  form.append("questionPaperId", questionPaperId);
  return request<{ sessionId: string }>("/api/upload/answer-sheet", { method: "POST", body: form });
}
