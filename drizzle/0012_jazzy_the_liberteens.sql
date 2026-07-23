-- Create an FTS5 virtual table for full-text search over the `article` table.
-- The article PK (`id`) is a text UUID, so it is stored as an UNINDEXED column
-- and used to map search results back to the source `article` row. Only the
-- searchable text columns (`title`, `summary`) are tokenized/indexed.
CREATE VIRTUAL TABLE `article_virtual` USING fts5 (
    id UNINDEXED,
    title,
    summary
);
--> statement-breakpoint

-- Backfill the FTS index from any existing rows.
INSERT INTO article_virtual (id, title, summary)
SELECT id, title, summary FROM article;
--> statement-breakpoint

-- Fold the FTS index sync into the existing summary-count triggers so there is a
-- single trigger per event. Recreate them with both the summary maintenance and
-- the article_virtual maintenance in one body.
DROP TRIGGER IF EXISTS article_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS article_after_delete;--> statement-breakpoint

CREATE TRIGGER article_after_insert
AFTER INSERT ON article
BEGIN
    INSERT INTO summary (id, name, label, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_articles',
      'Articles',
      (SELECT COUNT(*) FROM article)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;

    INSERT INTO article_virtual (id, title, summary)
    VALUES (new.id, new.title, new.summary);
END;
--> statement-breakpoint

CREATE TRIGGER article_after_delete
AFTER DELETE ON article
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM article)
    WHERE name = 'total_articles';

    DELETE FROM article_virtual WHERE id = old.id;
END;
--> statement-breakpoint

-- No existing summary trigger fires on UPDATE, so this trigger only keeps the
-- FTS index in sync when an article's title/summary changes.
CREATE TRIGGER article_after_update
AFTER UPDATE ON article
BEGIN
    DELETE FROM article_virtual WHERE id = old.id;
    INSERT INTO article_virtual (id, title, summary)
    VALUES (new.id, new.title, new.summary);
END;
