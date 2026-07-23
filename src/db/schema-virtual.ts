import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type ArticleVirtual = typeof articleVirtual.$inferSelect;
export type ArticleVirtuals = Array<ArticleVirtual>;
export type YoutubeVideoVirtual = typeof youtubeVideoVirtual.$inferSelect;
export type YoutubeVideoVirtuals = Array<YoutubeVideoVirtual>;

export const articleVirtual = sqliteTable('article_virtual', {
  id: text().notNull(),
  title: text().notNull(),
  summary: text().notNull(),
});

export const youtubeVideoVirtual = sqliteTable('youtube_video_virtual', {
  id: text().notNull(),
  title: text().notNull(),
  summary: text().notNull(),
});
