import { questions, type Domain, type Question } from "./data";

export type ItemQuality = {
  id: string;
  domain: Domain;
  code: string;
  type: Question["type"];
  difficultyTarget: Question["difficultyTarget"];
  reviewStatus: Question["reviewStatus"];
  responseCount: number;
  scoredCount: number;
  correctCount: number;
  accuracy: number | null;
  scoringCoverage: number;
  flag: "缺少评分规则" | "样本不足" | "难度待检查" | "待教师审核" | "可持续观察";
};

export type ItemQualityReport = {
  generatedAt: string;
  summary: {
    total: number;
    structuredScoring: number;
    needsScoringRules: number;
    lowSample: number;
    needsDifficultyReview: number;
  };
  items: ItemQuality[];
};

type SubmissionRow = {
  answersJson: string;
};

function parseAnswers(value: string) {
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/[.。!！?？,，]/g, "");
}

function score(question: Question, value: string) {
  if (!value || question.answer === undefined) return null;
  if (typeof question.answer === "number") return Number(value) === question.answer;
  return normalise(value) === normalise(question.answer);
}

export function buildItemQualityReport(rows: SubmissionRow[]): ItemQualityReport {
  const answers = rows.map((row) => parseAnswers(row.answersJson));
  const items = questions.map((question) => {
    let responseCount = 0;
    let scoredCount = 0;
    let correctCount = 0;

    for (const submission of answers) {
      const value = submission[question.id] ?? "";
      if (!value.trim()) continue;
      responseCount += 1;
      const result = score(question, value);
      if (result === null) continue;
      scoredCount += 1;
      if (result) correctCount += 1;
    }

    const accuracy = scoredCount ? Math.round((correctCount / scoredCount) * 100) : null;
    const scoringCoverage = responseCount ? Math.round((scoredCount / responseCount) * 100) : 0;
    let flag: ItemQuality["flag"] = "可持续观察";
    if (question.answer === undefined) flag = "缺少评分规则";
    else if (responseCount < 5) flag = "样本不足";
    else if (accuracy !== null && (accuracy < 20 || accuracy > 90)) flag = "难度待检查";
    else if (question.reviewStatus !== "published" && question.reviewStatus !== "reviewed") flag = "待教师审核";

    return {
      id: question.id,
      domain: question.domain,
      code: question.code,
      type: question.type,
      difficultyTarget: question.difficultyTarget,
      reviewStatus: question.reviewStatus,
      responseCount,
      scoredCount,
      correctCount,
      accuracy,
      scoringCoverage,
      flag,
    } satisfies ItemQuality;
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: items.length,
      structuredScoring: items.filter((item) => item.scoringCoverage > 0 || item.flag !== "缺少评分规则").length,
      needsScoringRules: items.filter((item) => item.flag === "缺少评分规则").length,
      lowSample: items.filter((item) => item.flag === "样本不足").length,
      needsDifficultyReview: items.filter((item) => item.flag === "难度待检查").length,
    },
    items,
  };
}
