CREATE TABLE `assessment_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`assessment_version` text NOT NULL,
	`student_code` text NOT NULL,
	`student_group` text DEFAULT '' NOT NULL,
	`answers_json` text NOT NULL,
	`objective_json` text DEFAULT '{}' NOT NULL,
	`answered_count` integer NOT NULL,
	`total_items` integer NOT NULL,
	`review_status` text DEFAULT 'submitted' NOT NULL,
	`teacher_scores_json` text DEFAULT '{}' NOT NULL,
	`teacher_notes_json` text DEFAULT '{}' NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE INDEX `submissions_submitted_at_idx` ON `assessment_submissions` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `submissions_student_code_idx` ON `assessment_submissions` (`student_code`);