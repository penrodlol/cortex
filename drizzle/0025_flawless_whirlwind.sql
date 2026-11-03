CREATE TABLE `summary_audio` (
	`id` text PRIMARY KEY NOT NULL,
	`audio_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `summary_audio_audio_url_unique` ON `summary_audio` (`audio_url`);--> statement-breakpoint
ALTER TABLE `article` ADD `summary_audio_id` text REFERENCES summary_audio(id);--> statement-breakpoint
ALTER TABLE `youtube_video` ADD `summary_audio_id` text REFERENCES summary_audio(id);