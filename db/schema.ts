import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const submissions = sqliteTable(
  "assessment_submissions",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id").notNull(),
    assessmentVersion: text("assessment_version").notNull(),
    studentCode: text("student_code").notNull(),
    studentGroup: text("student_group").notNull().default(""),
    answersJson: text("answers_json").notNull(),
    objectiveJson: text("objective_json").notNull().default("{}"),
    answeredCount: integer("answered_count").notNull(),
    totalItems: integer("total_items").notNull(),
    reviewStatus: text("review_status").notNull().default("submitted"),
    teacherScoresJson: text("teacher_scores_json").notNull().default("{}"),
    teacherNotesJson: text("teacher_notes_json").notNull().default("{}"),
    startedAt: text("started_at"),
    elapsedSeconds: integer("elapsed_seconds"),
    submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    reviewedAt: text("reviewed_at"),
  },
  (table) => [
    index("submissions_submitted_at_idx").on(table.submittedAt),
    index("submissions_student_code_idx").on(table.studentCode),
  ],
);

export const students = sqliteTable(
  "students",
  {
    id: text("id").primaryKey(),
    studentCode: text("student_code").notNull(),
    studentGroup: text("student_group").notNull().default(""),
    stage: text("stage").notNull().default("S1"),
    target: text("target").notNull().default("建立稳定的中一英语能力"),
    status: text("status").notNull().default("active"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("students_student_code_uidx").on(table.studentCode),
    index("students_status_idx").on(table.status),
  ],
);

export const teachingWorkspaces = sqliteTable(
  "teaching_workspaces",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    sourceSubmissionId: text("source_submission_id").notNull(),
    stage: text("stage").notNull().default("diagnostic_ready"),
    policyVersion: text("policy_version").notNull().default("teaching-policy-0.1"),
    workspaceJson: text("workspace_json").notNull(),
    completedStepsJson: text("completed_steps_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("teaching_workspaces_student_uidx").on(table.studentId),
    index("teaching_workspaces_stage_idx").on(table.stage),
  ],
);

export const automationEvents = sqliteTable(
  "automation_events",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => teachingWorkspaces.id),
    eventType: text("event_type").notNull(),
    payloadJson: text("payload_json").notNull().default("{}"),
    policyVersion: text("policy_version").notNull().default("teaching-policy-0.1"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("automation_events_student_idx").on(table.studentId),
    index("automation_events_workspace_idx").on(table.workspaceId),
    index("automation_events_type_idx").on(table.eventType),
  ],
);
