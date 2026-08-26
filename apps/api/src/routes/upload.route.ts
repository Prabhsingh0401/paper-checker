import { Request, Response } from "express";

export default function uploadRoute(req: Request, res: Response) {
  res.status(501).json({ error: "Not implemented" });
}
