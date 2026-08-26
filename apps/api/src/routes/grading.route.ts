import { Request, Response } from "express";

export default function gradingRoute(req: Request, res: Response) {
  res.status(501).json({ error: "Not implemented" });
}
