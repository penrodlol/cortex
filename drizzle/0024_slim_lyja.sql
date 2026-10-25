DROP TABLE `x_post`;--> statement-breakpoint
DROP TABLE `x_user`;--> statement-breakpoint
DELETE FROM `summary` WHERE `name` IN ('total_x_users', 'total_x_posts');
