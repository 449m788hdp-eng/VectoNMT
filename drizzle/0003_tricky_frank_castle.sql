ALTER TABLE `profiles` ADD `first_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `last_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `grade` text DEFAULT '11' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `fourth_subject` text DEFAULT 'english' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `subject_targets_json` text DEFAULT '{}' NOT NULL;