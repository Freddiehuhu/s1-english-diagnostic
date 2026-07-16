import { desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { submissions } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { buildItemQualityReport } from "../../../item-quality";

export const dynamic = "force-dynamic";

async function isAuthorisedTeacher() {
  const user = await getChatGPTUser();
  const expected = env.TEACHER_EMAIL?.trim().toLowerCase();
  return Boolean(user && expected && user.email.toLowerCase() === expected);
}

export async function GET() {
  if (!(await isAuthorisedTeacher())) {
    return Response.json({ error: "无权查看题目质量数据。" }, { status: 403 });
  }

  try {
    const rows = await getDb()
      .select({ answersJson: submissions.answersJson })
      .from(submissions)
      .orderBy(desc(submissions.submittedAt))
      .limit(500);
    return Response.json({ report: buildItemQualityReport(rows) });
  } catch {
    return Response.json({ error: "暂时无法生成题目质量报告。" }, { status: 500 });
  }
}
