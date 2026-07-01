PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__backup_article` AS SELECT * FROM `article`;--> statement-breakpoint
CREATE TABLE `__backup_youtube_video` AS SELECT * FROM `youtube_video`;--> statement-breakpoint
CREATE TABLE `__new_article_publisher` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`rss_url` text NOT NULL,
	`logo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_article_publisher`("id", "name", "url", "rss_url", "logo_url", "created_at") SELECT "id", "name", "url", "rss_url", "logo_url", "created_at" FROM `article_publisher`;--> statement-breakpoint
DROP TABLE `article_publisher`;--> statement-breakpoint
ALTER TABLE `__new_article_publisher` RENAME TO `article_publisher`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `article_publisher_name_unique` ON `article_publisher` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `article_publisher_url_unique` ON `article_publisher` (`url`);--> statement-breakpoint
CREATE TABLE `__new_youtube_channel` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`name` text NOT NULL,
	`logo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_youtube_channel`("id", "handle", "name", "logo_url", "created_at") SELECT "id", "handle", "name", "logo_url", "created_at" FROM `youtube_channel`;--> statement-breakpoint
DROP TABLE `youtube_channel`;--> statement-breakpoint
ALTER TABLE `__new_youtube_channel` RENAME TO `youtube_channel`;--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_channel_handle_unique` ON `youtube_channel` (`handle`);--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_channel_name_unique` ON `youtube_channel` (`name`);--> statement-breakpoint
INSERT OR IGNORE INTO `article`("id", "title", "url", "summary", "pub_date", "created_at", "article_publisher_id") SELECT "id", "title", "url", "summary", "pub_date", "created_at", "article_publisher_id" FROM `__backup_article`;--> statement-breakpoint
INSERT OR IGNORE INTO `youtube_video`("id", "title", "video_id", "thumbnail_url", "summary", "pub_date", "created_at", "youtube_channel_id") SELECT "id", "title", "video_id", "thumbnail_url", "summary", "pub_date", "created_at", "youtube_channel_id" FROM `__backup_youtube_video`;--> statement-breakpoint
DROP TABLE `__backup_article`;--> statement-breakpoint
DROP TABLE `__backup_youtube_video`;