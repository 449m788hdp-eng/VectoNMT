DROP INDEX `learning_sessions_one_active`;--> statement-breakpoint
CREATE UNIQUE INDEX `learning_sessions_one_active` ON `learning_sessions` (`user_id`) WHERE status IN ('active','break');