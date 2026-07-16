import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
    submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    reviewedAt: text("reviewed_at"),
  },
  (table) => [
    index("submissions_submitted_at_idx").on(table.submittedAt),
    index("submissions_student_code_idx").on(table.studentCode),
  ],
);
