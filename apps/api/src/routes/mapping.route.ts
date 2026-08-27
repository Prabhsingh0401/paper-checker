import { Router, Request, Response } from "express";
import { getSession } from "../store/sessionStore";

const router = Router();

router.get("/:sessionId", (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const session = getSession(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  if (session.status === "error") {
    res.status(500).json({ error: session.error || "Processing failed." });
    return;
  }

  if (session.status === "uploading" || session.status === "extracting") {
    res.status(202).json({ error: "Results not ready yet." });
    return;
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    questions: session.questions,
    mappings: session.mappings,
    unmatchedAnswers: session.unmatchedAnswers,
    imageUrl: session.answerSheetPath ? `${baseUrl}/uploads/${session.answerSheetPath}` : "",
    questionPaperUrl: session.questionPaperPath ? `${baseUrl}/uploads/${session.questionPaperPath}` : "",
    questionPaperId: session.questionPaperId || "",
  });
});

export default router;
