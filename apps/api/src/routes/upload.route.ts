import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createSession,
  updateSession,
  generateSessionId,
  addQuestionPaper,
  getQuestionPaper,
  getQuestionPapers,
} from "../store/sessionStore";
import { extractFromQuestionPaper, extractFromAnswerSheet, AIOverloadedError } from "../services/gemini.service";
import mapAnswersToQuestions from "../services/mapping.service";
import gradeAnswers from "../services/grading.service";

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.get("/question-papers", (_req: Request, res: Response) => {
  const papers = getQuestionPapers().map((qp) => ({
    id: qp.id,
    filename: qp.filename,
    questionCount: qp.questions.length,
  }));
  res.json({ questionPapers: papers });
});

router.post(
  "/",
  upload.fields([
    { name: "questionPaper", maxCount: 1 },
    { name: "answerSheet", maxCount: 1 },
    { name: "answerKey", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    const files = req.files as Record<string, Express.Multer.File[]>;

    if (!files?.questionPaper?.[0] || !files?.answerSheet?.[0]) {
      res.status(400).json({ error: "Both question paper and answer sheet are required." });
      return;
    }

    const sessionId = generateSessionId();
    createSession(sessionId);

    const qpFile = files.questionPaper[0];
    const asFile = files.answerSheet[0];
    const akFile = files?.answerKey?.[0];

    updateSession(sessionId, {
      questionPaperPath: qpFile.filename,
      answerSheetPath: asFile.filename,
      answerKeyPath: akFile?.filename,
      questionPaperMime: qpFile.mimetype,
      answerSheetMime: asFile.mimetype,
      status: "uploading",
    });

    res.json({ sessionId });

    runPipeline(sessionId).catch((err) => {
      console.error("Pipeline error:", err);
      updateSession(sessionId, {
        status: "error",
        error: err instanceof Error ? err.message : "Pipeline failed",
        errorCode: err instanceof AIOverloadedError ? "ai-overloaded" : undefined,
      });
    });
  }
);

router.post(
  "/answer-sheet",
  upload.single("answerSheet"),
  async (req: Request, res: Response) => {
    const file = req.file;
    const questionPaperId = req.body.questionPaperId as string;

    if (!file) {
      res.status(400).json({ error: "Answer sheet is required." });
      return;
    }

    if (!questionPaperId) {
      res.status(400).json({ error: "questionPaperId is required." });
      return;
    }

    const qp = getQuestionPaper(questionPaperId);
    if (!qp) {
      res.status(404).json({ error: "Question paper not found. It may have been lost if the server restarted." });
      return;
    }

    const sessionId = generateSessionId();
    createSession(sessionId);

    updateSession(sessionId, {
      questionPaperPath: qp.filename,
      questionPaperMime: qp.mime,
      questions: qp.questions,
      answerSheetPath: file.filename,
      answerSheetMime: file.mimetype,
      questionPaperId,
      status: "uploading",
    });

    res.json({ sessionId });

    runAnswerSheetPipeline(sessionId).catch((err) => {
      console.error("Pipeline error:", err);
      updateSession(sessionId, {
        status: "error",
        error: err instanceof Error ? err.message : "Pipeline failed",
        errorCode: err instanceof AIOverloadedError ? "ai-overloaded" : undefined,
      });
    });
  }
);

async function runPipeline(sessionId: string) {
  const { getSession } = await import("../store/sessionStore");
  const session = getSession(sessionId);
  if (!session) return;

  const apiBase = process.env.ALLOWED_ORIGIN || "http://localhost:4000";

  // Step 1: Extract questions from question paper
  updateSession(sessionId, { status: "extracting" });

  const qpPath = path.join(uploadsDir, session.questionPaperPath!);
  const qpBuffer = fs.readFileSync(qpPath);
  const qpMime = session.questionPaperMime || "application/pdf";

  const questions = await extractFromQuestionPaper(qpBuffer, qpMime);
  console.log(`[Session ${sessionId}] Extracted ${questions.length} questions`);
  updateSession(sessionId, { questions });

  const qpId = generateSessionId();
  addQuestionPaper({
    id: qpId,
    filename: session.questionPaperPath!,
    mime: qpMime,
    questions,
  });
  updateSession(sessionId, { questionPaperId: qpId });

  // Step 2: Extract answers from answer sheet
  const asPath = path.join(uploadsDir, session.answerSheetPath!);
  const asBuffer = fs.readFileSync(asPath);
  const asMime = session.answerSheetMime || "application/pdf";

  const answers = await extractFromAnswerSheet(asBuffer, asMime);
  console.log(`[Session ${sessionId}] Extracted ${answers.length} answers`);
  updateSession(sessionId, { answers });

  // Step 3: Map answers to questions
  updateSession(sessionId, { status: "mapping" });
  const { mappings, unmatchedAnswers } = mapAnswersToQuestions(questions, answers);
  console.log(`[Session ${sessionId}] Mapped ${mappings.filter(m => m.status === "answered").length} answers, ${unmatchedAnswers.length} unmatched`);
  updateSession(sessionId, { mappings, unmatchedAnswers });

  // Step 4: Grade
  updateSession(sessionId, { status: "grading" });

  try {
    let answerKeyText: string | undefined;
    if (session.answerKeyPath) {
      const akPath = path.join(uploadsDir, session.answerKeyPath);
      answerKeyText = fs.readFileSync(akPath, "utf-8");
    }
    const grading = await gradeAnswers(questions, mappings, answerKeyText);
    updateSession(sessionId, { grading, status: "done" });
  } catch (err) {
    console.error("Grading failed:", err);
    updateSession(sessionId, { status: "done" });
  }
}

async function runAnswerSheetPipeline(sessionId: string) {
  const { getSession } = await import("../store/sessionStore");
  const session = getSession(sessionId);
  if (!session) return;

  // Questions already set from registry — skip QP extraction
  const questions = session.questions;

  // Step 1: Extract answers from answer sheet
  updateSession(sessionId, { status: "extracting" });
  const asPath = path.join(uploadsDir, session.answerSheetPath!);
  const asBuffer = fs.readFileSync(asPath);
  const asMime = session.answerSheetMime || "application/pdf";

  const answers = await extractFromAnswerSheet(asBuffer, asMime);
  console.log(`[Session ${sessionId}] Extracted ${answers.length} answers`);
  updateSession(sessionId, { answers });

  // Step 2: Map answers to questions
  updateSession(sessionId, { status: "mapping" });
  const { mappings, unmatchedAnswers } = mapAnswersToQuestions(questions, answers);
  console.log(`[Session ${sessionId}] Mapped ${mappings.filter(m => m.status === "answered").length} answers, ${unmatchedAnswers.length} unmatched`);
  updateSession(sessionId, { mappings, unmatchedAnswers });

  // Step 3: Grade
  updateSession(sessionId, { status: "grading" });
  try {
    let answerKeyText: string | undefined;
    if (session.answerKeyPath) {
      const akPath = path.join(uploadsDir, session.answerKeyPath);
      answerKeyText = fs.readFileSync(akPath, "utf-8");
    }
    const grading = await gradeAnswers(questions, mappings, answerKeyText);
    updateSession(sessionId, { grading, status: "done" });
  } catch (err) {
    console.error("Grading failed:", err);
    updateSession(sessionId, { status: "done" });
  }
}

export default router;
