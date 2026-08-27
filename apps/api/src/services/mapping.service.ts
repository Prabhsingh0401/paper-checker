interface Answer {
  label: string;
  text: string;
  boundingBoxes: { x: number; y: number; width: number; height: number; page: number }[];
  confidence: "high" | "low";
}

interface Question {
  number: string;
  text: string;
  subParts?: string[];
}

interface MappingEntry {
  questionNumber: string;
  answer: Answer | null;
  status: "answered" | "unanswered" | "needs_review";
}

function extractNum(s: string): string {
  const m = s.match(/(\d+)/);
  return m ? m[1] : s;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export default function mapAnswersToQuestions(
  questions: Question[],
  answers: Answer[]
): { mappings: MappingEntry[]; unmatchedAnswers: Answer[] } {
  const usedAnswers = new Set<number>();
  const mappings: MappingEntry[] = [];

  // Pass 1: exact or numeric label match
  for (const question of questions) {
    const qNum = normalize(question.number);
    const qNumRaw = extractNum(question.number);
    let bestIdx = -1;

    for (let i = 0; i < answers.length; i++) {
      if (usedAnswers.has(i)) continue;
      const aLabel = normalize(answers[i].label);
      const aNum = normalize(extractNum(answers[i].label));

      // Match: "1" == "1", "Q1" == "1", "1." == "1", "q1" == "1"
      if (
        aNum === qNum ||
        aLabel === qNum ||
        aNum === qNumRaw ||
        aLabel.replace(/^q/, "") === qNum ||
        aNum.replace(/^q/, "") === qNum
      ) {
        bestIdx = i;
        break;
      }
    }

    if (bestIdx >= 0) {
      usedAnswers.add(bestIdx);
      const answer = answers[bestIdx];
      mappings.push({
        questionNumber: question.number,
        answer,
        status: answer.confidence === "low" ? "needs_review" : "answered",
      });
    } else {
      mappings.push({
        questionNumber: question.number,
        answer: null,
        status: "unanswered",
      });
    }
  }

  // Pass 2: keyword overlap for unmatched questions
  const unmatchedIndices = mappings
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.status === "unanswered")
    .map(({ i }) => i);

  for (let i = 0; i < answers.length; i++) {
    if (usedAnswers.has(i)) continue;
    const answer = answers[i];
    const aWords = new Set(
      answer.text.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
    );

    let bestQIdx = -1;
    let bestScore = 0;

    for (const qIdx of unmatchedIndices) {
      const q = questions[qIdx];
      const qWords = new Set(
        q.text.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
      );
      let overlap = 0;
      for (const w of qWords) {
        if (aWords.has(w)) overlap++;
      }
      if (overlap > bestScore) {
        bestScore = overlap;
        bestQIdx = qIdx;
      }
    }

    if (bestQIdx >= 0 && bestScore >= 2) {
      usedAnswers.add(i);
      mappings[bestQIdx] = {
        questionNumber: questions[bestQIdx].number,
        answer,
        status: answer.confidence === "low" ? "needs_review" : "answered",
      };
    }
  }

  const unmatchedAnswers = answers.filter((_, i) => !usedAnswers.has(i));
  return { mappings, unmatchedAnswers };
}
