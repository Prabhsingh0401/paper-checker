import { Request, Response } from "express";

export default function mappingRoute(req: Request, res: Response) {
  res.status(501).json({ error: "Not implemented" });
}
