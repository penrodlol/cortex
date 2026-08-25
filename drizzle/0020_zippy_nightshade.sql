PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_x_user` (
	`id` text PRIMARY KEY NOT NULL,
	`x_id` text NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`logo_url` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_x_user`("id", "x_id", "username", "name", "logo_url", "created_at") SELECT "id", "x_id", "username", "name", "logo_url", "created_at" FROM `x_user`;--> statement-breakpoint
DROP TABLE `x_user`;--> statement-breakpoint
ALTER TABLE `__new_x_user` RENAME TO `x_user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `x_user_x_id_unique` ON `x_user` (`x_id`);--> statement-breakpoint
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