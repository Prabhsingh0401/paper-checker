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

  // Build a reliable base URL. On Render, RENDER_EXTERNAL_URL is the public
  // HTTPS URL — using it avoids mixed-content blocking (req.protocol can be
  // http behind Render's proxy even when the page is served over https).
  const host = req.get("host") || "";
  const proto = req.get("x-forwarded-proto") || req.protocol;
  const forwardedBase = `${proto}://${host}`;
  const baseUrl = process.env.RENDER_EXTERNAL_URL || forwardedBase;

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
