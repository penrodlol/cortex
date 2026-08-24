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
export type GithubRepositoryLanguage = typeof githubRepositoryLanguage.$inferSelect;
export type GithubRepositoryLanguages = Array<GithubRepositoryLanguage>;
export type GithubRepositoryPublisher = typeof githubRepositoryPublisher.$inferSelect;
export type GithubRepositoryPublishers = Array<GithubRepositoryPublisher>;
export type GithubRepository = typeof githubRepository.$inferSelect;
export type GithubRepositories = Array<GithubRepository>;
export type XUser = typeof xUser.$inferSelect;
export type XUsers = Array<XUser>;
export type XPost = typeof xPost.$inferSelect;
export type XPosts = Array<XPost>;
export type Summary = typeof summary.$inferSelect;
export type Summaries = Array<Summary>;

const primaryKey = text()
  .primaryKey()
  .notNull()
  .$defaultFn(() => crypto.randomUUID());
const foreignKey = (columnName: string, ...props: Parameters<SQLiteColumnBuilder['references']>) => text(columnName).references(...props);
const timestamp = (columnName: string) =>
  integer(columnName)
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);

// ==================================================================
//                              TABLES
// ==================================================================

export const articlePublisher = sqliteTable('article_publisher', {
  id: primaryKey,
  name: text().unique().notNull(),
  url: text().unique().notNull(),
  rssUrl: text('rss_url').notNull(),
  logoUrl: text('logo_url').notNull(),
  createdAt: timestamp('created_at'),
});

export const article = sqliteTable('article', {
  id: primaryKey,
  title: text().notNull(),
  url: text().unique().notNull(),
  summary: text().notNull(),
  pubDate: integer('pub_date').notNull(),
  createdAt: timestamp('created_at'),
  articlePublisherId: foreignKey('article_publisher_id', () => articlePublisher.id, { onDelete: 'cascade' }).notNull(),
});

export const youtubeChannel = sqliteTable('youtube_channel', {
  id: primaryKey,
  handle: text().unique().notNull(),
  name: text().unique().notNull(),
  logoUrl: text('logo_url').notNull(),
  createdAt: timestamp('created_at'),
});

export const youtubeVideo = sqliteTable('youtube_video', {
  id: primaryKey,
  title: text().notNull(),
  videoId: text('video_id').unique().notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  summary: text().notNull(),
  pubDate: integer('pub_date').notNull(),
  createdAt: timestamp('created_at'),
  youtubeChannelId: foreignKey('youtube_channel_id', () => youtubeChannel.id, { onDelete: 'cascade' }).notNull(),
});

export const githubRepositoryLanguage = sqliteTable('github_repository_language', {
  id: primaryKey,
  name: text().unique().notNull(),
  watchTrending: integer('watch_trending').notNull().default(0),
  createdAt: timestamp('created_at'),
});

export const githubRepositoryPublisher = sqliteTable('github_repository_publisher', {
  id: primaryKey,
  name: text().notNull(),
  url: text().unique().notNull(),
  logoUrl: text('logo_url').notNull(),
  createdAt: timestamp('created_at'),
});

export const githubRepository = sqliteTable('github_repository', {
  id: primaryKey,
  title: text().notNull(),
  summary: text().notNull(),
  url: text().unique().notNull(),
  updatedAt: timestamp('updated_at'),
  createdAt: timestamp('created_at'),
  githubRepositoryLanguageId: foreignKey('github_repository_language_id', () => githubRepositoryLanguage.id, {
    onDelete: 'cascade',
  }).notNull(),
  githubRepositoryPublisherId: foreignKey('github_repository_publisher_id', () => githubRepositoryPublisher.id, {
    onDelete: 'cascade',
  }).notNull(),
});

export const xUser = sqliteTable('x_user', {
  id: primaryKey,
  xId: text('x_id').unique().notNull(),
  username: text().notNull(),
  name: text().notNull(),
  logoUrl: text('logo_url').notNull(),
  createdAt: timestamp('created_at'),
});

export const xPost = sqliteTable('x_post', {
  id: primaryKey,
  xId: text('x_id').unique().notNull(),
  text: text().notNull(),
  pubDate: integer('pub_date').notNull(),
  createdAt: timestamp('created_at'),
  xUserId: foreignKey('x_user_id', () => xUser.id, { onDelete: 'cascade' }).notNull(),
  xRepostedUserId: foreignKey('x_reposted_user_id', () => xUser.id, { onDelete: 'cascade' }),
});

export const summary = sqliteTable('summary', {
  id: primaryKey,
  name: text({
    enum: [
      'total_article_publishers',
      'total_articles',
      'total_youtube_channels',
      'total_youtube_videos',
      'total_github_repository_languages',
      'total_github_repository_publishers',
      'total_github_repositories',
      'total_x_users',
      'total_x_posts',
    ],
  })
    .unique()
    .notNull(),
  label: text().unique().notNull(),
  value: integer().notNull(),
  createdAt: timestamp('created_at'),
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

export const githubRepositoryLanguageRelations = relations(githubRepositoryLanguage, ({ many }) => ({
  repositories: many(githubRepository),
}));

export const githubRepositoryPublisherRelations = relations(githubRepositoryPublisher, ({ many }) => ({
  repositories: many(githubRepository),
}));

export const githubRepositoryRelations = relations(githubRepository, ({ one }) => ({
  githubRepositoryLanguage: one(githubRepositoryLanguage, {
    fields: [githubRepository.githubRepositoryLanguageId],
    references: [githubRepositoryLanguage.id],
  }),
  githubRepositoryPublisher: one(githubRepositoryPublisher, {
    fields: [githubRepository.githubRepositoryPublisherId],
    references: [githubRepositoryPublisher.id],
  }),
}));

export const xUserRelations = relations(xUser, ({ many }) => ({
  posts: many(xPost),
  repostedPosts: many(xPost, { relationName: 'xRepostedUser' }),
}));

export const xPostRelations = relations(xPost, ({ one }) => ({
  user: one(xUser, { fields: [xPost.xUserId], references: [xUser.id] }),
  repostedUser: one(xUser, { fields: [xPost.xRepostedUserId], references: [xUser.id] }),
}));
