CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`student_code` text NOT NULL,
	`student_group` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'S1' NOT NULL,
	`target` text DEFAULT '建立稳定的中一英语能力' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_student_code_uidx` ON `students` (`student_code`);--> statement-breakpoint
CREATE INDEX `students_status_idx` ON `students` (`status`);--> statement-breakpoint
CREATE TABLE `teaching_workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`source_submission_id` text NOT NULL,
	`stage` text DEFAULT 'diagnostic_ready' NOT NULL,
	`policy_version` text DEFAULT 'teaching-policy-0.1' NOT NULL,
	`workspace_json` text NOT NULL,
	`completed_steps_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teaching_workspaces_student_uidx` ON `teaching_workspaces` (`student_id`);--> statement-breakpoint
CREATE INDEX `teaching_workspaces_stage_idx` ON `teaching_workspaces` (`stage`);--> statement-breakpoint
CREATE TABLE `automation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`policy_version` text DEFAULT 'teaching-policy-0.1' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workspace_id`) REFERENCES `teaching_workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `automation_events_student_idx` ON `automation_events` (`student_id`);--> statement-breakpoint
CREATE INDEX `automation_events_workspace_idx` ON `automation_events` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `automation_events_type_idx` ON `automation_events` (`event_type`);
