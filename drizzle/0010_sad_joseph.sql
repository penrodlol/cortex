DROP TRIGGER IF EXISTS article_publisher_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS article_publisher_after_delete;--> statement-breakpoint
DROP TRIGGER IF EXISTS article_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS article_after_delete;--> statement-breakpoint
DROP TRIGGER IF EXISTS youtube_channel_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS youtube_channel_after_delete;--> statement-breakpoint
DROP TRIGGER IF EXISTS youtube_video_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS youtube_video_after_delete;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_summary` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_summary`("id", "name", "label", "value", "created_at") SELECT "id", "name", COALESCE("label", CASE "name"
	WHEN 'total_article_publishers' THEN 'Article Publishers'
	WHEN 'total_articles' THEN 'Articles'
	WHEN 'total_youtube_channels' THEN 'YouTube Channels'
	WHEN 'total_youtube_videos' THEN 'YouTube Videos'
	ELSE "name"
END), "value", "created_at" FROM `summary`;--> statement-breakpoint
DROP TABLE `summary`;--> statement-breakpoint
ALTER TABLE `__new_summary` RENAME TO `summary`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `summary_name_unique` ON `summary` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `summary_label_unique` ON `summary` (`label`);--> statement-breakpoint
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
END;
--> statement-breakpoint
CREATE TRIGGER article_after_delete
AFTER DELETE ON article
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM article)
    WHERE name = 'total_articles';
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
END;
--> statement-breakpoint
CREATE TRIGGER youtube_video_after_delete
AFTER DELETE ON youtube_video
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM youtube_video)
    WHERE name = 'total_youtube_videos';
END;