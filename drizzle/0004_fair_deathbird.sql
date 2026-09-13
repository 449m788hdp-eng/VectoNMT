CREATE TABLE `exam_configs` (
	`subject_slug` text PRIMARY KEY NOT NULL,
	`config_json` text NOT NULL,
	`scale_json` text NOT NULL,
	`year` integer DEFAULT 2026 NOT NULL,
	FOREIGN KEY (`subject_slug`) REFERENCES `subjects`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`stage` integer DEFAULT 1 NOT NULL,
	`current_index` integer DEFAULT 0 NOT NULL,
	`deadline` integer,
	`break_until` integer,
	`config_json` text NOT NULL,
	`result_json` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `learning_sessions_user_status` ON `learning_sessions` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `session_items` (
	`session_id` text NOT NULL,
	`question_id` text NOT NULL,
	`subject_slug` text NOT NULL,
	`topic_id` integer NOT NULL,
	`canonical_key` text NOT NULL,
	`stage` integer NOT NULL,
	`position` integer NOT NULL,
	`snapshot_json` text NOT NULL,
	`answer` text DEFAULT '' NOT NULL,
	`flagged` integer DEFAULT 0 NOT NULL,
	`revealed` integer DEFAULT 0 NOT NULL,
	`points` integer,
	`max_points` integer NOT NULL,
	PRIMARY KEY(`session_id`, `question_id`),
	FOREIGN KEY (`session_id`) REFERENCES `learning_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_items_canonical` ON `session_items` (`canonical_key`);--> statement-breakpoint
CREATE INDEX `session_items_topic` ON `session_items` (`topic_id`);--> statement-breakpoint
ALTER TABLE `questions` ADD `canonical_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `active` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `source_kind` text DEFAULT 'practice' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `exam_format` text DEFAULT 'single_choice' NOT NULL;--> statement-breakpoint
CREATE INDEX `questions_eligible` ON `questions` (`subject_slug`,`active`,`exam_format`);
--> statement-breakpoint
