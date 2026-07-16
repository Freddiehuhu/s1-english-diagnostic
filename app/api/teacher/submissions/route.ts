import { desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { submissions } from "../../../../db/schema";
import { getDb } from "../../../../db";
import { domains, type Domain } from "../../../data";
import { getChatGPTUser } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

async function isAuthorisedTeacher() {
  const user = await getChatGPTUser();
  const expected = env.TEACHER_EMAIL?.trim().toLowerCase();
  return Boolean(user && expected && user.email.toLowerCase() === expected);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  if (!(await isAuthorisedTeacher())) {
    return Response.json({ error: "无权查看教师数据。" }, { status: 403 });
  }

  try {
    const rows = await getDb()
      .select()
      .from(submissions)
      .orderBy(desc(submissions.submittedAt))
      .limit(100);

    return Response.json({
      submissions: rows.map((row) => ({
        ...row,
        answers: parseJson<Record<string, string>>(row.answersJson, {}),
        objective: parseJson<Record<string, unknown>>(row.objectiveJson, {}),
        teacherScores: parseJson<Partial<Record<Domain, number>>>(row.teacherScoresJson, {}),
        teacherNotes: parseJson<Partial<Record<Domain, string>>>(row.teacherNotesJson, {}),
        answersJson: undefined,
        objectiveJson: undefined,
        teacherScoresJson: undefined,
        teacherNotesJson: undefined,
      })),
    });
  } catch {
    return Response.json({ error: "暂时无法读取提交记录。" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthorisedTeacher())) {
    return Response.json({ error: "无权修改教师数据。" }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as {
      id?: string;
      reviewStatus?: string;
      teacherScores?: Partial<Record<Domain, number>>;
      teacherNotes?: Partial<Record<Domain, string>>;
    };
    const id = payload.id?.trim() ?? "";
    const reviewStatus = ["submitted", "in_review", "reviewed"].includes(payload.reviewStatus ?? "")
      ? payload.reviewStatus!
      : "in_review";
    if (!id) return Response.json({ error: "缺少提交编号。" }, { status: 400 });

    const scores = Object.fromEntries(
      domains
        .filter((domain) => {
          const score = payload.teacherScores?.[domain];
          return typeof score === "number" && score >= 0 && score <= 4;
        })
        .map((domain) => [domain, payload.teacherScores![domain]]),
    );
    const notes = Object.fromEntries(
      domains
        .filter((domain) => typeof payload.teacherNotes?.[domain] === "string")
        .map((domain) => [domain, payload.teacherNotes![domain]!.slice(0, 2000)]),
    );

    await getDb()
      .update(submissions)
      .set({
        reviewStatus,
        teacherScoresJson: JSON.stringify(scores),
        teacherNotesJson: JSON.stringify(notes),
        reviewedAt: new Date().toISOString(),
      })
      .where(eq(submissions.id, id));

    return Response.json({ ok: true, reviewStatus });
  } catch {
    return Response.json({ error: "保存教师复核失败。" }, { status: 500 });
  }
}
