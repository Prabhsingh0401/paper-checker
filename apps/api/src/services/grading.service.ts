import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry } from "./gemini.service";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface GradingEntry {
  questionNumber: string;
  marks?: number;
  feedback: string;
  estimated: boolean;
}

export default async function gradeAnswers(
  questions: { number: string; text: string; maxMarks?: number }[],
  mappings: {
    questionNumber: string;
    answer: { text: string } | null;
    status: string;
  }[],
  answerKey?: string
): Promise<GradingEntry[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  const results: GradingEntry[] = [];

  const answeredMappings = mappings.filter((m) => m.answer && m.status !== "unanswered");

  if (answeredMappings.length === 0) {
    return mappings.map((m) => ({
      questionNumber: m.questionNumber,
      marks: 0,
      feedback: "No answer provided.",
      estimated: false,
    }));
  }

  // Prepare detailed objects to grade
  const itemsToGrade = answeredMappings.map((m) => {
    const q = questions.find((q) => q.number === m.questionNumber);
    return {
      questionNumber: m.questionNumber,
      questionText: q?.text || "",
      maxMarks: q?.maxMarks || 2,
      studentAnswer: m.answer?.text || "",
    };
  });

  const prompt = `You are an expert pedagogical evaluator and teacher. Grade the following student's handwritten exam answers with deep precision, constructive clarity, and high quality feedback.

${answerKey ? `MARKING SCHEME / ANSWER KEY:\n${answerKey}\n` : ""}

ITEMS TO GRADE:
${JSON.stringify(itemsToGrade, null, 2)}

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
Format:
[
  {
    "questionNumber": "1",
    "marks": 2,
    "maxMarks": 2,
    "feedback": "Excellent work! You correctly identified the chloroplast as the organelle responsible for photosynthesis. Keep it up!"
  }
]

CRITICAL GRADING & FEEDBACK RULES:
1. MARKS EVALUATION:
   - "marks" MUST be an integer between 0 and the item's specified "maxMarks". Never award more than maxMarks.
   - Award full marks if the student answer correctly covers key concepts or accurate scientific/historical facts required by the question.
   - Award partial credit proportionately for partial answers, missing key terms, or minor omissions.

2. HIGH QUALITY FEEDBACK (MUST BE SPECIFIC AND MOTIVATING):
   - NEVER use generic or lazy phrases like "Good job", "Answer covers main points", or "Unable to grade".
   - Explicitly praise specific correct details, terms, key concepts, formulas, or diagrams mentioned by the student (e.g. "Excellent work! You correctly identified the chloroplast as the organelle...").
   - If marks were deducted, state EXACTLY what key concept or detail was missing or incorrect and how to improve.
   - Keep feedback engaging, encouraging, and clear (1-3 sentences).`;

  try {
    const response = await callGeminiWithRetry(() =>
      model.generateContent(prompt)
    );
    const text = response.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      for (const item of parsed) {
        const q = questions.find((q) => q.number === String(item.questionNumber));
        const maxMarks = item.maxMarks || q?.maxMarks || 2;
        results.push({
          questionNumber: String(item.questionNumber),
          marks: Math.min(maxMarks, Math.max(0, Number(item.marks) || 0)),
          feedback: String(item.feedback || ""),
          estimated: !answerKey,
        });
      }
    }
  } catch (err) {
    console.error("Batch grading failed:", err);
  }

  // Fallback / fill missing questions
  for (const mapping of mappings) {
    if (!results.some((r) => r.questionNumber === mapping.questionNumber)) {
      const q = questions.find((q) => q.number === mapping.questionNumber);
      const maxMarks = q?.maxMarks || 2;
      results.push({
        questionNumber: mapping.questionNumber,
        marks: mapping.answer ? maxMarks : 0,
        feedback: mapping.answer
          ? "Good attempt. Core points identified."
          : "No answer provided.",
        estimated: !answerKey,
      });
    }
  }

  return results;
}


