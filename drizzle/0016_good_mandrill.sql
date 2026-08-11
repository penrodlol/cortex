-- Summary-count triggers for the github_repository_language,
-- github_repository_publisher and github_repository tables, mirroring the
-- existing count triggers on article_publisher / youtube_channel. Each insert
-- upserts the matching summary row; each delete refreshes its count.
DROP TRIGGER IF EXISTS github_repository_language_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS github_repository_language_after_delete;--> statement-breakpoint
DROP TRIGGER IF EXISTS github_repository_publisher_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS github_repository_publisher_after_delete;--> statement-breakpoint
DROP TRIGGER IF EXISTS github_repository_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS github_repository_after_delete;--> statement-breakpoint

CREATE TRIGGER github_repository_language_after_insert
AFTER INSERT ON github_repository_language
BEGIN
    INSERT INTO summary (id, name, label, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_github_repository_languages',
      'GitHub Repository Languages',
      (SELECT COUNT(*) FROM github_repository_language)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER github_repository_language_after_delete
AFTER DELETE ON github_repository_language
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM github_repository_language)
    WHERE name = 'total_github_repository_languages';
END;
--> statement-breakpoint

CREATE TRIGGER github_repository_publisher_after_insert
AFTER INSERT ON github_repository_publisher
BEGIN
    INSERT INTO summary (id, name, label, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_github_repository_publishers',
      'GitHub Repository Publishers',
      (SELECT COUNT(*) FROM github_repository_publisher)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER github_repository_publisher_after_delete
AFTER DELETE ON github_repository_publisher
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM github_repository_publisher)
    WHERE name = 'total_github_repository_publishers';
END;
--> statement-breakpoint

CREATE TRIGGER github_repository_after_insert
AFTER INSERT ON github_repository
BEGIN
    INSERT INTO summary (id, name, label, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_github_repositories',
      'GitHub Repositories',
      (SELECT COUNT(*) FROM github_repository)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER github_repository_after_delete
AFTER DELETE ON github_repository
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM github_repository)
    WHERE name = 'total_github_repositories';
END;
--> statement-breakpoint

-- Backfill the new summary rows for any existing data.
INSERT INTO summary (id, name, label, value)
VALUES (
  (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  'total_github_repository_languages',
  'GitHub Repository Languages',
  (SELECT COUNT(*) FROM github_repository_language)
)
ON CONFLICT(name) DO UPDATE SET value = excluded.value;--> statement-breakpoint
INSERT INTO summary (id, name, label, value)
VALUES (
  (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  'total_github_repository_publishers',
  'GitHub Repository Publishers',
  (SELECT COUNT(*) FROM github_repository_publisher)
)
ON CONFLICT(name) DO UPDATE SET value = excluded.value;--> statement-breakpoint
INSERT INTO summary (id, name, label, value)
VALUES (
  (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  'total_github_repositories',
  'GitHub Repositories',
  (SELECT COUNT(*) FROM github_repository)
)
ON CONFLICT(name) DO UPDATE SET value = excluded.value;