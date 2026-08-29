PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_x_post` (
	`id` text PRIMARY KEY NOT NULL,
	`x_id` text NOT NULL,
	`text` text NOT NULL,
	`pub_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`x_user_id` text NOT NULL,
	`reference_type` text,
	`x_referenced_post_id` text,
	FOREIGN KEY (`x_user_id`) REFERENCES `x_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`x_referenced_post_id`) REFERENCES `x_post`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_x_post`("id", "x_id", "text", "pub_date", "created_at", "x_user_id", "reference_type", "x_referenced_post_id") SELECT "id", "x_id", "text", "pub_date", "created_at", "x_user_id", "reference_type", "x_referenced_post_id" FROM `x_post`;--> statement-breakpoint
DROP TABLE `x_post`;--> statement-breakpoint
ALTER TABLE `__new_x_post` RENAME TO `x_post`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `x_post_x_id_unique` ON `x_post` (`x_id`);--> statement-breakpoint

-- Recreate summary-count triggers dropped by the x_post table rebuild.
DROP TRIGGER IF EXISTS x_post_after_insert;--> statement-breakpoint
DROP TRIGGER IF EXISTS x_post_after_delete;--> statement-breakpoint
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