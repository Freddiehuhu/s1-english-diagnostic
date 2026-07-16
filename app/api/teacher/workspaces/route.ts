import { desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { automationEvents, students, submissions, teachingWorkspaces } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  advanceTeachingWorkspace,
  buildTeachingWorkspace,
  teachingPolicyVersion,
  type AutomationAction,
  type CompletedSteps,
  type TeachingWorkspaceData,
  type WorkspaceStage,
} from "../../../teaching-engine";

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

async function listWorkspaces() {
  const rows = await getDb()
    .select({ workspace: teachingWorkspaces, student: students })
    .from(teachingWorkspaces)
    .innerJoin(students, eq(teachingWorkspaces.studentId, students.id))
    .orderBy(desc(teachingWorkspaces.updatedAt));

  return rows.map(({ workspace, student }) => ({
    id: workspace.id,
    studentId: student.id,
    studentCode: student.studentCode,
    studentGroup: student.studentGroup,
    studentStage: student.stage,
    target: student.target,
    isDemo: student.isDemo,
    sourceSubmissionId: workspace.sourceSubmissionId,
    stage: workspace.stage as WorkspaceStage,
    policyVersion: workspace.policyVersion,
    data: parseJson<TeachingWorkspaceData>(workspace.workspaceJson, {} as TeachingWorkspaceData),
    completed: parseJson<CompletedSteps>(workspace.completedStepsJson, {}),
    updatedAt: workspace.updatedAt,
  }));
}

async function addEvent(args: {
  studentId: string;
  workspaceId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  await getDb().insert(automationEvents).values({
    id: crypto.randomUUID(),
    studentId: args.studentId,
    workspaceId: args.workspaceId,
    eventType: args.eventType,
    payloadJson: JSON.stringify(args.payload ?? {}),
    policyVersion: teachingPolicyVersion,
  });
}

export async function GET() {
  if (!(await isAuthorisedTeacher())) {
    return Response.json({ error: "无权查看教学工作区。" }, { status: 403 });
  }

  try {
    return Response.json({ items: await listWorkspaces() });
  } catch {
    return Response.json({ error: "暂时无法读取教学工作区。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorisedTeacher())) {
    return Response.json({ error: "无权修改教学工作区。" }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as {
      action?: "sync" | "advance";
      workspaceId?: string;
      automationAction?: AutomationAction;
    };

    if (payload.action === "sync") {
      const submissionRows = await getDb()
        .select()
        .from(submissions)
        .orderBy(desc(submissions.submittedAt))
        .limit(100);
      const latestByStudent = new Map<string, (typeof submissionRows)[number]>();
      for (const row of submissionRows) {
        if (!latestByStudent.has(row.studentCode)) latestByStudent.set(row.studentCode, row);
      }

      for (const row of latestByStudent.values()) {
        const existingStudent = (
          await getDb().select().from(students).where(eq(students.studentCode, row.studentCode)).limit(1)
        )[0];
        const studentId = existingStudent?.id ?? crypto.randomUUID();
        if (!existingStudent) {
          await getDb().insert(students).values({
            id: studentId,
            studentCode: row.studentCode,
            studentGroup: row.studentGroup,
            stage: "S1",
            target: row.studentCode.startsWith("TEST-")
              ? "四课内验证诊断—教学—复测闭环"
              : "建立稳定的中一英语能力",
            isDemo: row.studentCode.startsWith("TEST-"),
          });
        } else if (existingStudent.studentGroup !== row.studentGroup) {
          await getDb()
            .update(students)
            .set({ studentGroup: row.studentGroup, updatedAt: new Date().toISOString() })
            .where(eq(students.id, studentId));
        }

        const existingWorkspace = (
          await getDb()
            .select()
            .from(teachingWorkspaces)
            .where(eq(teachingWorkspaces.studentId, studentId))
            .limit(1)
        )[0];

        if (!existingWorkspace || existingWorkspace.sourceSubmissionId !== row.id) {
          const workspaceId = existingWorkspace?.id ?? crypto.randomUUID();
          const data = buildTeachingWorkspace({
            id: row.id,
            studentCode: row.studentCode,
            studentGroup: row.studentGroup,
            assessmentVersion: row.assessmentVersion,
            answers: parseJson<Record<string, string>>(row.answersJson, {}),
            submittedAt: row.submittedAt,
          });

          if (existingWorkspace) {
            await getDb()
              .update(teachingWorkspaces)
              .set({
                sourceSubmissionId: row.id,
                stage: "diagnostic_ready",
                policyVersion: teachingPolicyVersion,
                workspaceJson: JSON.stringify(data),
                completedStepsJson: "{}",
                updatedAt: new Date().toISOString(),
              })
              .where(eq(teachingWorkspaces.id, workspaceId));
          } else {
            await getDb().insert(teachingWorkspaces).values({
              id: workspaceId,
              studentId,
              sourceSubmissionId: row.id,
              stage: "diagnostic_ready",
              policyVersion: teachingPolicyVersion,
              workspaceJson: JSON.stringify(data),
            });
          }
          await addEvent({
            studentId,
            workspaceId,
            eventType: "DiagnosticSubmitted",
            payload: { sourceSubmissionId: row.id, assessmentVersion: row.assessmentVersion },
          });
        }
      }

      return Response.json({ items: await listWorkspaces(), message: "诊断记录已同步，AI工作区已更新。" });
    }

    if (payload.action === "advance" && payload.workspaceId && payload.automationAction) {
      const workspace = (
        await getDb()
          .select()
          .from(teachingWorkspaces)
          .where(eq(teachingWorkspaces.id, payload.workspaceId))
          .limit(1)
      )[0];
      if (!workspace) return Response.json({ error: "找不到教学工作区。" }, { status: 404 });

      const currentData = parseJson<TeachingWorkspaceData>(workspace.workspaceJson, {} as TeachingWorkspaceData);
      const currentCompleted = parseJson<CompletedSteps>(workspace.completedStepsJson, {});
      const next = advanceTeachingWorkspace(currentData, currentCompleted, payload.automationAction);

      await getDb()
        .update(teachingWorkspaces)
        .set({
          stage: next.stage,
          workspaceJson: JSON.stringify(next.data),
          completedStepsJson: JSON.stringify(next.completed),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(teachingWorkspaces.id, workspace.id));
      await addEvent({
        studentId: workspace.studentId,
        workspaceId: workspace.id,
        eventType: next.eventType,
        payload: { action: payload.automationAction, nextStage: next.stage },
      });

      return Response.json({ items: await listWorkspaces(), message: "自动化步骤已完成并写入事件记录。" });
    }

    return Response.json({ error: "无法识别的自动化操作。" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "教学工作区操作失败";
    const tableMissing = message.includes("no such table");
    return Response.json(
      { error: tableMissing ? "教学工作区正在初始化，请稍后重试。" : "暂时无法执行自动化操作。" },
      { status: 500 },
    );
  }
}
