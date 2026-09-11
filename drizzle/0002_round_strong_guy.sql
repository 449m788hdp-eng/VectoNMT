ALTER TABLE `subjects` ADD `bank_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `topics` ADD `section_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `topics` ADD `position` integer DEFAULT 0 NOT NULL;