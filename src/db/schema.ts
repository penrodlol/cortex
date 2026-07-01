import { relations, sql } from 'drizzle-orm';
import { integer, SQLiteColumnBuilder, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type ArticlePublisher = typeof articlePublisher.$inferSelect;
export type ArticlePublishers = Array<ArticlePublisher>;
export type Article = typeof article.$inferSelect;
export type Articles = Array<Article>;
export type YoutubeChannel = typeof youtubeChannel.$inferSelect;
export type YoutubeChannels = Array<YoutubeChannel>;
export type YoutubeVideo = typeof youtubeVideo.$inferSelect;
export type YoutubeVideos = Array<YoutubeVideo>;
export type Summary = typeof summary.$inferSelect;
export type Summaries = Array<Summary>;

const primaryKey = text()
  .primaryKey()
  .notNull()
  .$defaultFn(() => crypto.randomUUID());
const foreignKey = (columnName: string, ...props: Parameters<SQLiteColumnBuilder['references']>) => text(columnName).references(...props);
const createdAt = integer('created_at')
  .notNull()
  .default(sql`(unixepoch())`);

// ==================================================================
//                              TABLES
// ==================================================================

export const articlePublisher = sqliteTable('article_publisher', {
  id: primaryKey,
  name: text().unique().notNull(),
  url: text().unique().notNull(),
  rssUrl: text('rss_url').notNull(),
  logoUrl: text('logo_url').notNull(),
  createdAt,
});

export const article = sqliteTable('article', {
  id: primaryKey,
  title: text().notNull(),
  url: text().unique().notNull(),
  summary: text().notNull(),
  pubDate: integer('pub_date').notNull(),
  createdAt,
  articlePublisherId: foreignKey('article_publisher_id', () => articlePublisher.id, { onDelete: 'cascade' }).notNull(),
});

export const youtubeChannel = sqliteTable('youtube_channel', {
  id: primaryKey,
  handle: text().unique().notNull(),
  name: text().unique().notNull(),
  logoUrl: text('logo_url').notNull(),
  createdAt,
});

export const youtubeVideo = sqliteTable('youtube_video', {
  id: primaryKey,
  title: text().notNull(),
  videoId: text('video_id').unique().notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  summary: text().notNull(),
  pubDate: integer('pub_date').notNull(),
  createdAt,
  youtubeChannelId: foreignKey('youtube_channel_id', () => youtubeChannel.id, { onDelete: 'cascade' }).notNull(),
});

export const summary = sqliteTable('summary', {
  id: primaryKey,
  name: text({
    enum: [
      'total_article_publishers',
      'total_articles',
      'total_youtube_channels',
      'total_youtube_videos',
      'total_articles_and_youtube_videos',
    ],
  })
    .unique()
    .notNull(),
  value: integer().notNull(),
  createdAt,
});

// ==================================================================
//                            RELATIONS
// ==================================================================

export const articlePublisherRelations = relations(articlePublisher, ({ many }) => ({ articles: many(article) }));

export const articleRelations = relations(article, ({ one }) => ({
  articlePublisher: one(articlePublisher, { fields: [article.articlePublisherId], references: [articlePublisher.id] }),
}));

export const youtubeChannelRelations = relations(youtubeChannel, ({ many }) => ({ videos: many(youtubeVideo) }));

export const youtubeVideoRelations = relations(youtubeVideo, ({ one }) => ({
  youtubeChannel: one(youtubeChannel, { fields: [youtubeVideo.youtubeChannelId], references: [youtubeChannel.id] }),
}));
