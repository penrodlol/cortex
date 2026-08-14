CREATE TABLE `x_post` (
	`id` text PRIMARY KEY NOT NULL,
	`x_id` text NOT NULL,
	`text` text NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`reposts` integer DEFAULT 0 NOT NULL,
	`replies` integer DEFAULT 0 NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`pub_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`x_user_id` text NOT NULL,
	`x_reposted_user_id` text,
	FOREIGN KEY (`x_user_id`) REFERENCES `x_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`x_reposted_user_id`) REFERENCES `x_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `x_post_x_id_unique` ON `x_post` (`x_id`);--> statement-breakpoint
CREATE TABLE `x_user` (
	`id` text PRIMARY KEY NOT NULL,
	`x_id` text NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`logo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `x_user_x_id_unique` ON `x_user` (`x_id`);--> statement-breakpoint

-- Summary-count triggers for the x_user and x_post tables, mirroring the
-- existing count triggers on the other source tables. Each insert upserts the
-- matching summary row; each delete refreshes its count.
DROP TRIGGER IF EXISTS x_user_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS x_user_after_delete;--> statement-breakpoint
DROP TRIGGER IF EXISTS x_post_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS x_post_after_delete;--> statement-breakpoint

CREATE TRIGGER x_user_after_insert
AFTER INSERT ON x_user
BEGIN
    INSERT INTO summary (id, name, label, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_x_users',
      'X Users',
      (SELECT COUNT(*) FROM x_user)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER x_user_after_delete
AFTER DELETE ON x_user
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM x_user)
    WHERE name = 'total_x_users';
END;
--> statement-breakpoint

CREATE TRIGGER x_post_after_insert
AFTER INSERT ON x_post
BEGIN
    INSERT INTO summary (id, name, label, value)
    VALUES (
      (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
      'total_x_posts',
      'X Posts',
      (SELECT COUNT(*) FROM x_post)
    )
    ON CONFLICT(name) DO UPDATE SET value = excluded.value;
END;
--> statement-breakpoint
CREATE TRIGGER x_post_after_delete
AFTER DELETE ON x_post
BEGIN
    UPDATE summary
    SET value = (SELECT COUNT(*) FROM x_post)
    WHERE name = 'total_x_posts';
END;
--> statement-breakpoint

-- Backfill the new summary rows for any existing data.
INSERT INTO summary (id, name, label, value)
VALUES (
  (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  'total_x_users',
  'X Users',
  (SELECT COUNT(*) FROM x_user)
)
ON CONFLICT(name) DO UPDATE SET value = excluded.value;--> statement-breakpoint
INSERT INTO summary (id, name, label, value)
VALUES (
  (SELECT LOWER(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  'total_x_posts',
  'X Posts',
  (SELECT COUNT(*) FROM x_post)
)
ON CONFLICT(name) DO UPDATE SET value = excluded.value;