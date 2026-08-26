import { Request, Response } from "express";

export default function extractRoute(req: Request, res: Response) {
  res.status(501).json({ error: "Not implemented" });
}
