import { submissions } from "../../../db/schema";
import { getDb } from "../../../db";
import {
  assessmentMeta,
  domainMeta,
  domains,
  questions,
  type Domain,
  type Question,
} from "../../data";

export const dynamic = "force-dynamic";

type ObjectiveDomainSummary = {
  total: number;
  attempted: number;
  correct: number;
};

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/[.。!！?？,，]/g, "");
}

function isObjective(question: Question) {
  return question.type === "mcq" || typeof question.answer === "string";
}

function isCorrect(question: Question, value: string) {
  if (!value || question.answer === undefined) return false;
  if (typeof question.answer === "number") return Number(value) === question.answer;
  return normalise(value) === normalise(question.answer);
}

function objectiveSummary(answers: Record<string, string>) {
  const summary = Object.fromEntries(
    domains.map((domain) => [
      domain,
      { total: 0, attempted: 0, correct: 0 } satisfies ObjectiveDomainSummary,
    ]),
  ) as Record<Domain, ObjectiveDomainSummary>;

  for (const question of questions) {
    if (!isObjective(question)) continue;
    const stats = summary[question.domain];
    const value = answers[question.id] ?? "";
    stats.total += 1;
    if (value.trim()) {
      stats.attempted += 1;
      if (isCorrect(question, value)) stats.correct += 1;
    }
  }

  return Object.fromEntries(
    domains.map((domain) => [
      domain,
      {
        ...summary[domain],
        label: domainMeta[domain].short,
      },
    ]),
  );
}

function cleanAnswers(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const allowedIds = new Set(questions.map((question) => question.id));
  const cleaned: Record<string, string> = {};

  for (const [id, value] of Object.entries(input)) {
    if (!allowedIds.has(id) || typeof value !== "string") continue;
    cleaned[id] = value.slice(0, 5000);
  }

  return cleaned;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      assessmentId?: string;
      assessmentVersion?: string;
      studentCode?: string;
      studentGroup?: string;
      answers?: unknown;
      startedAt?: string;
    };

    if (
      payload.assessmentId !== assessmentMeta.id ||
      payload.assessmentVersion !== assessmentMeta.version
    ) {
      return Response.json({ error: "测试版本不匹配，请刷新页面后重试。" }, { status: 409 });
    }

    const studentCode = payload.studentCode?.trim().slice(0, 32) ?? "";
    const studentGroup = payload.studentGroup?.trim().slice(0, 40) ?? "";
    if (studentCode.length < 2) {
      return Response.json({ error: "请输入至少 2 个字符的学生编号。" }, { status: 400 });
    }

    const answers = cleanAnswers(payload.answers);
    if (!answers) {
      return Response.json({ error: "答案格式无效。" }, { status: 400 });
    }

    const answeredCount = questions.filter((question) => answers[question.id]?.trim()).length;
    const id = crypto.randomUUID();
    const summary = objectiveSummary(answers);
    const startedAtDate = payload.startedAt ? new Date(payload.startedAt) : null;
    const validStartedAt = startedAtDate && !Number.isNaN(startedAtDate.getTime())
      ? startedAtDate.toISOString()
      : null;
    const elapsedSeconds = validStartedAt
      ? Math.max(0, Math.round((Date.now() - new Date(validStartedAt).getTime()) / 1000))
      : null;

    const db = getDb();
    await db.insert(submissions).values({
      id,
      assessmentId: assessmentMeta.id,
      assessmentVersion: assessmentMeta.version,
      studentCode,
      studentGroup,
      answersJson: JSON.stringify(answers),
      objectiveJson: JSON.stringify(summary),
      answeredCount,
      totalItems: questions.length,
      startedAt: validStartedAt,
      elapsedSeconds,
    });

    return Response.json(
      {
        receipt: {
          id,
          submittedAt: new Date().toISOString(),
          answeredCount,
          totalItems: questions.length,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "提交失败";
    const tableMissing = message.includes("no such table");
    return Response.json(
      { error: tableMissing ? "提交服务正在初始化，请稍后重试。" : "暂时无法提交，请保留本机草稿后重试。" },
      { status: 500 },
    );
  }
}
