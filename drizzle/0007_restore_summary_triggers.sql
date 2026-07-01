-- Recreate summary triggers on article_publisher and youtube_channel that were
-- implicitly dropped when 0006_lush_klaw.sql dropped/recreated those tables.
DROP TRIGGER IF EXISTS article_publisher_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS article_publisher_after_delete;--> statement-breakpoint
DROP TRIGGER IF EXISTS youtube_channel_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS youtube_channel_after_delete;--> statement-breakpoint
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
UPDATE summary SET value = (SELECT COUNT(*) FROM article_publisher) WHERE name = 'total_article_publishers';--> statement-breakpoint
UPDATE summary SET value = (SELECT COUNT(*) FROM youtube_channel) WHERE name = 'total_youtube_channels';