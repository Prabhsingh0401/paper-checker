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

  res.json({
    status: session.status,
    error: session.error,
    errorCode: session.errorCode,
  });
});

export default router;
