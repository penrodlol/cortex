CREATE TABLE `github_repository` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`url` text NOT NULL,
	`stars` integer NOT NULL,
	`forks` integer NOT NULL,
	`watchers` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`github_repository_language_id` text NOT NULL,
	`github_repository_publisher_id` text NOT NULL,
	FOREIGN KEY (`github_repository_language_id`) REFERENCES `github_repository_language`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`github_repository_publisher_id`) REFERENCES `github_repository_publisher`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_repository_url_unique` ON `github_repository` (`url`);--> statement-breakpoint
CREATE TABLE `github_repository_language` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`watch_trending` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_repository_language_name_unique` ON `github_repository_language` (`name`);--> statement-breakpoint
CREATE TABLE `github_repository_publisher` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`logo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_repository_publisher_name_unique` ON `github_repository_publisher` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_repository_publisher_url_unique` ON `github_repository_publisher` (`url`);