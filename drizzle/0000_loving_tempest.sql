CREATE TABLE `article` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`summary` text NOT NULL,
	`pub_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`article_publisher_id` text NOT NULL,
	FOREIGN KEY (`article_publisher_id`) REFERENCES `article_publisher`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_url_unique` ON `article` (`url`);--> statement-breakpoint
CREATE TABLE `article_publisher` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`rss_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_publisher_name_unique` ON `article_publisher` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `article_publisher_url_unique` ON `article_publisher` (`url`);--> statement-breakpoint
CREATE TABLE `youtube_channel` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_channel_handle_unique` ON `youtube_channel` (`handle`);--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_channel_name_unique` ON `youtube_channel` (`name`);--> statement-breakpoint
CREATE TABLE `youtube_video` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`summary` text NOT NULL,
	`pub_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`youtube_channel_id` text NOT NULL,
	FOREIGN KEY (`youtube_channel_id`) REFERENCES `youtube_channel`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_video_url_unique` ON `youtube_video` (`url`);