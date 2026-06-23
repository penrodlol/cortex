ALTER TABLE `youtube_video` RENAME COLUMN "url" TO "video_id";--> statement-breakpoint
DROP INDEX `youtube_video_url_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_video_video_id_unique` ON `youtube_video` (`video_id`);