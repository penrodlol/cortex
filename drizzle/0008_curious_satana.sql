PRAGMA foreign_keys=OFF;--> statement-breakpoint
-- ==================================================================
--        BACKUP EXISTING DATA BEFORE RECREATING THE TABLES
-- ==================================================================
CREATE TABLE `__backup_article_publisher` AS SELECT * FROM `article_publisher`;--> statement-breakpoint
CREATE TABLE `__backup_article` AS SELECT * FROM `article`;--> statement-breakpoint
CREATE TABLE `__backup_youtube_channel` AS SELECT * FROM `youtube_channel`;--> statement-breakpoint
CREATE TABLE `__backup_youtube_video` AS SELECT * FROM `youtube_video`;--> statement-breakpoint
CREATE TABLE `__backup_summary` AS SELECT * FROM `summary`;--> statement-breakpoint
-- ==================================================================
--          DROP OLD TABLES (FKs are OFF, no cascades fire)
-- ==================================================================
DROP TABLE `article`;--> statement-breakpoint
DROP TABLE `youtube_video`;--> statement-breakpoint
DROP TABLE `article_publisher`;--> statement-breakpoint
DROP TABLE `youtube_channel`;--> statement-breakpoint
DROP TABLE `summary`;--> statement-breakpoint
-- ==================================================================
--        RECREATE TABLES WITH MILLISECOND created_at DEFAULT
-- ==================================================================
CREATE TABLE `article_publisher` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`rss_url` text NOT NULL,
	`logo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `article` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`summary` text NOT NULL,
	`pub_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`article_publisher_id` text NOT NULL,
	FOREIGN KEY (`article_publisher_id`) REFERENCES `article_publisher`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `youtube_channel` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`name` text NOT NULL,
	`logo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `youtube_video` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`video_id` text NOT NULL,
	`thumbnail_url` text NOT NULL,
	`summary` text NOT NULL,
	`pub_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`youtube_channel_id` text NOT NULL,
	FOREIGN KEY (`youtube_channel_id`) REFERENCES `youtube_channel`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `summary` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
-- ==================================================================
--   RESTORE DATA — created_at was stored in SECONDS (unixepoch()),
--   convert to MILLISECONDS (* 1000) to match the new precision.
-- ==================================================================
INSERT INTO `article_publisher`("id", "name", "url", "rss_url", "logo_url", "created_at") SELECT "id", "name", "url", "rss_url", "logo_url", "created_at" * 1000 FROM `__backup_article_publisher`;--> statement-breakpoint
INSERT INTO `article`("id", "title", "url", "summary", "pub_date", "created_at", "article_publisher_id") SELECT "id", "title", "url", "summary", "pub_date", "created_at" * 1000, "article_publisher_id" FROM `__backup_article`;--> statement-breakpoint
INSERT INTO `youtube_channel`("id", "handle", "name", "logo_url", "created_at") SELECT "id", "handle", "name", "logo_url", "created_at" * 1000 FROM `__backup_youtube_channel`;--> statement-breakpoint
INSERT INTO `youtube_video`("id", "title", "video_id", "thumbnail_url", "summary", "pub_date", "created_at", "youtube_channel_id") SELECT "id", "title", "video_id", "thumbnail_url", "summary", "pub_date", "created_at" * 1000, "youtube_channel_id" FROM `__backup_youtube_video`;--> statement-breakpoint
INSERT INTO `summary`("id", "name", "value", "created_at") SELECT "id", "name", "value", "created_at" * 1000 FROM `__backup_summary`;--> statement-breakpoint
-- ==================================================================
--                      RECREATE INDEXES
-- ==================================================================
CREATE UNIQUE INDEX `article_publisher_name_unique` ON `article_publisher` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `article_publisher_url_unique` ON `article_publisher` (`url`);--> statement-breakpoint
CREATE UNIQUE INDEX `article_url_unique` ON `article` (`url`);--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_channel_handle_unique` ON `youtube_channel` (`handle`);--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_channel_name_unique` ON `youtube_channel` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `youtube_video_video_id_unique` ON `youtube_video` (`video_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `summary_name_unique` ON `summary` (`name`);--> statement-breakpoint
-- ==================================================================
--   RECREATE SUMMARY TRIGGERS (dropped with the tables above)
-- ==================================================================
CREATE TRIGGER article_publisher_after_insert
AFTER INSERT ON article_publisher
BEGIN
    INSERT INTO summary (id, name, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_article_publishers',
      (SELECT COUNT(*) FROM article_publisher)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER article_publisher_after_delete
AFTER DELETE ON article_publisher
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM article_publisher)
    WHERE name = 'total_article_publishers';
END;
--> statement-breakpoint
CREATE TRIGGER article_after_insert
AFTER INSERT ON article
BEGIN
    INSERT INTO summary (id, name, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_articles',
      (SELECT COUNT(*) FROM article)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;

    INSERT INTO summary (id, name, value)
    VALUES (
        (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
        'total_articles_and_youtube_videos',
        (SELECT COUNT(*) FROM article) + (SELECT COUNT(*) FROM youtube_video)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER article_after_delete
AFTER DELETE ON article
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM article)
    WHERE name = 'total_articles';

    UPDATE summary
    SET value = (SELECT COUNT(*) FROM article) + (SELECT COUNT(*) FROM youtube_video)
    WHERE name = 'total_articles_and_youtube_videos';
END;
--> statement-breakpoint
CREATE TRIGGER youtube_channel_after_insert
AFTER INSERT ON youtube_channel
BEGIN
    INSERT INTO summary (id, name, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_youtube_channels',
      (SELECT COUNT(*) FROM youtube_channel)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER youtube_channel_after_delete
AFTER DELETE ON youtube_channel
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM youtube_channel)
    WHERE name = 'total_youtube_channels';
END;
--> statement-breakpoint
CREATE TRIGGER youtube_video_after_insert
AFTER INSERT ON youtube_video
BEGIN
    INSERT INTO summary (id, name, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_youtube_videos',
      (SELECT COUNT(*) FROM youtube_video)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;

    INSERT INTO summary (id, name, value)
    VALUES (
        (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
        'total_articles_and_youtube_videos',
        (SELECT COUNT(*) FROM youtube_video) + (SELECT COUNT(*) FROM article)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER youtube_video_after_delete
AFTER DELETE ON youtube_video
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM youtube_video)
    WHERE name = 'total_youtube_videos';

    UPDATE summary
    SET value = (SELECT COUNT(*) FROM youtube_video) + (SELECT COUNT(*) FROM article)
    WHERE name = 'total_articles_and_youtube_videos';
END;
--> statement-breakpoint
-- ==================================================================
--                  CLEAN UP BACKUP TABLES
-- ==================================================================
DROP TABLE `__backup_article`;--> statement-breakpoint
DROP TABLE `__backup_article_publisher`;--> statement-breakpoint
DROP TABLE `__backup_youtube_channel`;--> statement-breakpoint
DROP TABLE `__backup_youtube_video`;--> statement-breakpoint
DROP TABLE `__backup_summary`;--> statement-breakpoint
PRAGMA foreign_keys=ON;