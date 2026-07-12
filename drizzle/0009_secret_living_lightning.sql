ALTER TABLE `summary` ADD `label` text;--> statement-breakpoint
CREATE UNIQUE INDEX `summary_label_unique` ON `summary` (`label`);