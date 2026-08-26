import { BoundingBox } from "./question";

export interface Answer {
  label: string;
  text: string;
  boundingBoxes: (BoundingBox & { page: number })[];
  confidence: "high" | "low";
}
