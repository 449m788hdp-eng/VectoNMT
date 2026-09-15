CREATE INDEX `idx_learning_sessions_user_completed` ON `learning_sessions` (`user_id`,`status`,`completed_at`);--> statement-breakpoint
CREATE INDEX `idx_questions_practice_selection` ON `questions` (`subject_slug`,`active`,`topic_id`,`canonical_key`);--> statement-breakpoint
CREATE INDEX `idx_questions_official_variant` ON `questions` (`subject_slug`,`source_kind`,`active`,`year`,`session`,`position`);--> statement-breakpoint
CREATE INDEX `idx_session_items_session_stage_position` ON `session_items` (`session_id`,`stage`,`position`);