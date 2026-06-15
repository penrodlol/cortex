CREATE TABLE `post` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`summary` text NOT NULL,
	`topic` text,
	`pub_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`site_id` text NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_url_unique` ON `post` (`url`);--> statement-breakpoint
CREATE TABLE `site` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`rss_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_name_unique` ON `site` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_url_unique` ON `site` (`url`);