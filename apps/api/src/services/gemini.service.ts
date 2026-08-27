import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Call Gemini API with automatic exponential backoff retry on rate limits (429 / RESOURCE_EXHAUSTED).
 */
export async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 4,
  initialDelayMs = 2000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("Quota exceeded");

      if (isRateLimit && attempt <= maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`[Gemini API] Rate limit hit. Retrying attempt ${attempt}/${maxRetries} in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

function bufferToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

export async function extractFromQuestionPaper(
  buffer: Buffer,
  mimeType: string
): Promise<{ number: string; text: string; maxMarks?: number; subParts?: string[] }[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `You are an exam paper parser. Extract ALL questions and their allocated maximum marks/weightage from this exam question paper image/pdf.

Return ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array.

Each element must be:
{"number": "1", "text": "Full question text here", "maxMarks": 2}

RULES:
- Use the EXACT question number as printed on the paper (e.g. "1", "2", "3", "11a", "11b")
- Include the COMPLETE question text, do not truncate
- Extract the allocated maximum marks for each question as an integer under "maxMarks" (e.g. 1, 2, 3, 4, or 5). Look for indicators like [1], [2 marks], (3 Marks), [1+1=2], or section headers (e.g., "Section A (2 marks each)"). Default to 2 if not explicitly stated.
- If a question has sub-parts like (a), (b), (c) that are separate questions, extract them as separate entries (e.g., number: "11a", "11b")
- Questions must be in the order they appear on the paper
- Every single question must be extracted - do not skip any

Example output:
[{"number": "1", "text": "Which blood vessel carries blood away from the heart?", "maxMarks": 2}, {"number": "2", "text": "Which organelle is primarily involved in photosynthesis?", "maxMarks": 2}]`;


  const result = await callGeminiWithRetry(() =>
    model.generateContent([prompt, bufferToGenerativePart(buffer, mimeType)])
  );

  const text = result.response.text();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("Failed to parse question paper response:", text.slice(0, 500));
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`Extracted ${parsed.length} questions from question paper`);
    return parsed;
  } catch (e) {
    console.error("JSON parse error for questions:", e);
    return [];
  }
}

export async function extractFromAnswerSheet(
  buffer: Buffer,
  mimeType: string
): Promise<{
  label: string;
  text: string;
  boundingBoxes: { x: number; y: number; width: number; height: number; page: number }[];
  confidence: "high" | "low";
}[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `You are an answer sheet parser. Extract ALL handwritten answers from this answer sheet image.

Return ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array.

Each element must be:
{
  "label": "1",
  "text": "The complete handwritten answer text",
  "boundingBox": {"x": 0.1, "y": 0.2, "width": 0.8, "height": 0.15},
  "confidence": "high"
}

RULES:
- The "label" is the question number the student is answering (just the number like "1", "2", "3")
- boundingBox uses FRACTIONS of the image (0.0 to 1.0):
  - x = left edge position as fraction of image width
  - y = top edge position as fraction of image height
  - width = box width as fraction of image width
  - height = box height as fraction of image height
- You MUST provide accurate bounding boxes for EACH answer - this is critical for highlighting
- confidence is "high" if handwriting is clearly readable, "low" if hard to read
- Extract the COMPLETE answer text, not just a summary
- Include ALL answers visible on the page, even partial ones
- If no answers are found, return an empty array []

Think carefully about the bounding box coordinates. Look at where each answer starts and ends on the page.`;

  const result = await callGeminiWithRetry(() =>
    model.generateContent([prompt, bufferToGenerativePart(buffer, mimeType)])
  );

  const text = result.response.text();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("Failed to parse answer sheet response:", text.slice(0, 500));
    return [];
  }

  try {
    const pageAnswers = JSON.parse(jsonMatch[0]);
    const answers = pageAnswers.map((answer: any) => ({
      label: String(answer.label || "Unknown").trim(),
      text: String(answer.text || "").trim(),
      boundingBoxes: [{
        x: Number(answer.boundingBox?.x) || 0,
        y: Number(answer.boundingBox?.y) || 0,
        width: Number(answer.boundingBox?.width) || 0.8,
        height: Number(answer.boundingBox?.height) || 0.1,
        page: 0,
      }],
      confidence: answer.confidence === "low" ? "low" as const : "high" as const,
    }));
    console.log(`Extracted ${answers.length} answers from answer sheet`);
    return answers;
  } catch (e) {
    console.error("JSON parse error for answers:", e);
    return [];
  }
}

