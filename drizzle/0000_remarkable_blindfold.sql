CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`external_id` text NOT NULL,
	`subject_slug` text NOT NULL,
	`topic_id` integer NOT NULL,
	`year` integer NOT NULL,
	`session` integer NOT NULL,
	`position` integer NOT NULL,
	`question_type` text NOT NULL,
	`prompt` text NOT NULL,
	`options_json` text DEFAULT '[]' NOT NULL,
	`correct_answer` text DEFAULT '' NOT NULL,
	`explanation` text DEFAULT '' NOT NULL,
	`images_json` text DEFAULT '[]' NOT NULL,
	`source_url` text NOT NULL,
	`official_pdf_url` text NOT NULL,
	`attribution` text NOT NULL,
	FOREIGN KEY (`subject_slug`) REFERENCES `subjects`(`slug`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `questions_subject_topic` ON `questions` (`subject_slug`,`topic_id`);--> statement-breakpoint
CREATE INDEX `questions_subject_session_position` ON `questions` (`subject_slug`,`session`,`position`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`exam_question_count` integer NOT NULL,
	`required` integer DEFAULT 0 NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_slug` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`subject_slug`) REFERENCES `subjects`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_subject_name` ON `topics` (`subject_slug`,`name`);