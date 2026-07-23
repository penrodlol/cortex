-- Create an FTS5 virtual table for full-text search over the `youtube_video` table.
-- The PK (`id`) is a text UUID, so it is stored as an UNINDEXED column and used to
-- map search results back to the source row. Only the searchable text columns
-- (`title`, `summary`) are tokenized/indexed.
CREATE VIRTUAL TABLE `youtube_video_virtual` USING fts5 (
    id UNINDEXED,
    title,
    summary
);
--> statement-breakpoint

-- Backfill the FTS index from any existing rows.
INSERT INTO youtube_video_virtual (id, title, summary)
SELECT id, title, summary FROM youtube_video;
--> statement-breakpoint

-- Fold the FTS index sync into the existing summary-count triggers so there is a
-- single trigger per event. Recreate them with both the summary maintenance and
-- the youtube_video_virtual maintenance in one body.
DROP TRIGGER IF EXISTS youtube_video_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS youtube_video_after_delete;--> statement-breakpoint

CREATE TRIGGER youtube_video_after_insert
AFTER INSERT ON youtube_video
BEGIN
    INSERT INTO summary (id, name, label, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_youtube_videos',
      'YouTube Videos',
      (SELECT COUNT(*) FROM youtube_video)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;

    INSERT INTO youtube_video_virtual (id, title, summary)
    VALUES (new.id, new.title, new.summary);
END;
--> statement-breakpoint

CREATE TRIGGER youtube_video_after_delete
AFTER DELETE ON youtube_video
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM youtube_video)
    WHERE name = 'total_youtube_videos';

    DELETE FROM youtube_video_virtual WHERE id = old.id;
END;
--> statement-breakpoint

-- No existing summary trigger fires on UPDATE, so this trigger only keeps the
-- FTS index in sync when a video's title/summary changes.
CREATE TRIGGER youtube_video_after_update
AFTER UPDATE ON youtube_video
BEGIN
    DELETE FROM youtube_video_virtual WHERE id = old.id;
    INSERT INTO youtube_video_virtual (id, title, summary)
    VALUES (new.id, new.title, new.summary);
END;
