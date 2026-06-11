import { relations, sql } from 'drizzle-orm';
import { SQLiteColumnBuilder, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type Site = typeof site.$inferSelect;
export type Sites = Array<Site>;
export type Post = typeof post.$inferSelect;
export type Posts = Array<Post>;

const primaryKey = text()
  .primaryKey()
  .notNull()
  .$defaultFn(() => crypto.randomUUID());
const foreignKey = (columnName: string, ...props: Parameters<SQLiteColumnBuilder['references']>) => text(columnName).references(...props);

// ==================================================================
//                              TABLES
// ==================================================================

export const site = sqliteTable('site', {
  id: primaryKey,
  name: text().unique().notNull(),
  url: text().unique().notNull(),
  rssUrl: text('rss_url').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const post = sqliteTable('post', {
  id: primaryKey,
  title: text().notNull(),
  url: text().unique().notNull(),
  summary: text().notNull(),
  topic: text(),
  pubDate: text('pub_date').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  siteId: foreignKey('site_id', () => site.id, { onDelete: 'cascade' }).notNull(),
});

// ==================================================================
//                            RELATIONS
// ==================================================================

export const siteRelations = relations(site, ({ many }) => ({ posts: many(post) }));

export const postRelations = relations(post, ({ one }) => ({ site: one(site) }));
