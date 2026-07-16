import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("labels the current assessment as demo content with versioned item metadata", async () => {
  const data = await source("app/data.ts");

  assert.match(data, /status: "demo"/);
  assert.match(data, /contentNotice: "演示题库/);
  assert.match(data, /sourceKind: "demo"/);
  assert.match(data, /reviewStatus: "draft"/);
  assert.match(data, /difficultyTarget: "core"/);
});

test("uses anonymous student codes and posts durable submissions", async () => {
  const page = await source("app/page.tsx");
  const route = await source("app/api/submissions/route.ts");

  assert.match(page, /学生编号/);
  assert.match(page, /不要填写真实姓名/);
  assert.match(page, /fetch\("\/api\/submissions"/);
  assert.doesNotMatch(page, /setMode\("teacher"\)/);
  assert.match(route, /studentCode/);
  assert.match(route, /assessmentVersion/);
  assert.match(route, /objectiveSummary/);
});

test("protects teacher records and stores only the minimum review data", async () => {
  const teacherRoute = await source("app/api/teacher/submissions/route.ts");
  const teacherPage = await source("app/teacher/page.tsx");
  const schema = await source("db/schema.ts");
  const migration = await source("drizzle/0000_huge_blob.sql");

  assert.match(teacherRoute, /TEACHER_EMAIL/);
  assert.match(teacherRoute, /getChatGPTUser/);
  assert.match(teacherPage, /requireChatGPTUser/);
  assert.match(schema, /assessment_submissions/);
  assert.match(schema, /answersJson/);
  assert.match(schema, /teacherScoresJson/);
  assert.match(migration, /CREATE TABLE `assessment_submissions`/);
});

test("builds an event-driven teaching workspace with teacher approval gates", async () => {
  const engine = await source("app/teaching-engine.ts");
  const workspaceRoute = await source("app/api/teacher/workspaces/route.ts");
  const workspaceUi = await source("app/teacher/workspace/teaching-workspace.tsx");
  const schema = await source("db/schema.ts");

  assert.match(engine, /TeachingWorkspaceData/);
  assert.match(engine, /Evidence → This suggests → Answer/);
  assert.match(engine, /TeacherReviewConfirmed/);
  assert.match(engine, /StageAssessmentCompleted/);
  assert.match(engine, /run_full_cycle/);
  assert.match(workspaceRoute, /isAuthorisedTeacher/);
  assert.match(workspaceRoute, /DiagnosticSubmitted/);
  assert.match(workspaceUi, /90秒课后记录/);
  assert.match(workspaceUi, /AI改进中心/);
  assert.match(schema, /teaching_workspaces/);
  assert.match(schema, /automation_events/);
});

test("protects student answers during network failures and records attempt duration", async () => {
  const page = await source("app/page.tsx");
  const route = await source("app/api/submissions/route.ts");
  const schema = await source("db/schema.ts");

  assert.match(page, /网络中断，答案仍保存在本机/);
  assert.match(page, /finally/);
  assert.match(route, /elapsedSeconds/);
  assert.match(schema, /elapsed_seconds/);
});
