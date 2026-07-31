import db, { article, articlePublisher, articleVirtual, youtubeChannel, youtubeVideo, youtubeVideoVirtual } from '@/db';
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { logError } from '../../utils/logger';

export type FeedItemType = 'Article' | 'YouTube Video';
export type FeedItemTypeUrlLabel = 'Read Article' | 'Watch Video';
export type GetFeedMetadataResponse = NonNullable<Awaited<ReturnType<typeof getFeedMetadata>>>;
export type GetFeedRequest = z.infer<typeof getFeedRequestSchema>;
export type GetFeedResponse = NonNullable<Awaited<ReturnType<typeof getFeed>>>;
export type GetFeedByQueryRequest = z.infer<typeof getFeedByQueryRequestSchema>;
export type GetFeedByQueryResponse = NonNullable<Awaited<ReturnType<typeof getFeedByQuery>>>;

export const GET_FEED_METADATA_ERROR = 'Error Retrieving Feed Metadata';
export const GET_FEED_ERROR = 'Error Retrieving Feed';
export const GET_FEED_BY_QUERY_ERROR = 'Error Retrieving Feed By Query';

export const FEED_CACHE_TIME = 5 * 60 * 1000;
export const GET_FEED_METADATA_RECENT_SIZE = 3;
export const GET_FEED_PAGE_SIZE = 15;
export const GET_FEED_DEFAULT_REQUEST: GetFeedRequest = { page: 1 };
export const GET_FEED_BY_QUERY_MAX_LENGTH = 100;

export const getFeedRequestSchema = z.object({
  page: z.number().positive().optional().default(1),
  excludedUrls: z.array(z.string()).optional(),
  types: z.array(z.enum(['Article', 'YouTube Video'] satisfies Array<FeedItemType>)).optional(),
  publisherIds: z.array(z.string()).optional(),
});

export const getFeedByQueryRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .max(GET_FEED_BY_QUERY_MAX_LENGTH)
    .transform((query) => (query.match(/\S+/g) ?? []).map((token) => `"${token.replace(/"/g, '""')}"*`).join(' ')),
});

export const getFeedMetadataQueryOptions = () =>
  queryOptions({
    queryKey: ['feedMetadata'],
    queryFn: () => getFeedMetadata(),
    staleTime: FEED_CACHE_TIME,
  });

export const getFeedQueryOptions = (data: GetFeedRequest) =>
  queryOptions({
    queryKey: ['feed', ...Object.values(data)],
    queryFn: () => getFeed({ data }),
    staleTime: FEED_CACHE_TIME,
    placeholderData: (previousData) => previousData,
  });

export const getFeedByQueryQueryOptions = (data: GetFeedByQueryRequest) =>
  queryOptions({
    queryKey: ['feedByQuery', ...Object.values(data)],
    queryFn: () => getFeedByQuery({ data }),
    enabled: data.query.trim().length > 0,
    placeholderData: (previousData) => previousData,
  });

export const getFeedMetadata = createServerFn().handler(async () => {
  try {
    const types = ['Article', 'YouTube Video'] satisfies Array<FeedItemType>;

    const articlePublishers = await db
      .select({ id: articlePublisher.id, type: sql<FeedItemType>`'Article'`.as('type'), name: articlePublisher.name })
      .from(articlePublisher);
    const youtubeChannels = await db
      .select({ id: youtubeChannel.id, type: sql<FeedItemType>`'YouTube Video'`.as('type'), name: youtubeChannel.name })
      .from(youtubeChannel);
    const publishers = [...articlePublishers, ...youtubeChannels].sort((a, b) => a.name.localeCompare(b.name));

    const feedEntries = getFeedEntries();
    const recentFeedEntries = await db
      .select()
      .from(feedEntries)
      .orderBy(desc(feedEntries.pubDate), asc(feedEntries.title))
      .limit(GET_FEED_METADATA_RECENT_SIZE);

    return { types, publishers, recentFeedEntries };
  } catch (error) {
    logError(GET_FEED_METADATA_ERROR, error);
    throw new Error(GET_FEED_METADATA_ERROR);
  }
});

export const getFeed = createServerFn({ method: 'POST' })
  .validator(getFeedRequestSchema)
  .handler(async ({ data }) => {
    try {
      const feedEntries = getFeedEntries();
      const entries = await db
        .select()
        .from(feedEntries)
        .where(
          and(
            data.excludedUrls?.length ? notInArray(feedEntries.url, data.excludedUrls) : undefined,
            data.types?.length ? inArray(feedEntries.type, data.types) : undefined,
            data.publisherIds?.length ? inArray(feedEntries.sourceId, data.publisherIds) : undefined,
          ),
        )
        .orderBy(desc(feedEntries.pubDate), asc(feedEntries.title))
        .limit(GET_FEED_PAGE_SIZE + 1)
        .offset(data.page === 1 ? 0 : (data.page - 1) * GET_FEED_PAGE_SIZE);

      return {
        entries: entries.slice(0, GET_FEED_PAGE_SIZE),
        hasPreviousPage: data.page > 1,
        hasNextPage: entries.length === GET_FEED_PAGE_SIZE + 1,
      };
    } catch (error) {
      logError(GET_FEED_ERROR, error);
      throw new Error(GET_FEED_ERROR);
    }
  });

export const getFeedByQuery = createServerFn({ method: 'POST' })
  .validator(getFeedByQueryRequestSchema)
  .handler(async ({ data }) => {
    try {
      const feedEntriesFields = getFeedEntriesFields();

      const articlesQueried = db
        .select({
          ...feedEntriesFields.article,
          title: sql<string>`highlight(article_virtual, 1, '<mark>', '</mark>')`.mapWith(String).as('title'),
          summary: sql<string>`highlight(article_virtual, 2, '<mark>', '</mark>')`.mapWith(String).as('summary'),
          summarySnippet: sql<string>`snippet(article_virtual, 2, '<mark>', '</mark>', '...', 30)`.mapWith(String).as('summary_snippet'),
          rank: sql<number>`bm25(article_virtual, 1.0, 10.0, 1.0)`.mapWith(Number).as('rank'),
        })
        .from(articleVirtual)
        .innerJoin(article, eq(article.id, articleVirtual.id))
        .innerJoin(articlePublisher, eq(articlePublisher.id, article.articlePublisherId))
        .where(sql`article_virtual MATCH ${data.query}`);

      const youtubeVideosQueried = db
        .select({
          ...feedEntriesFields.youtubeVideo,
          title: sql<string>`highlight(youtube_video_virtual, 1, '<mark>', '</mark>')`.mapWith(String).as('title'),
          summary: sql<string>`highlight(youtube_video_virtual, 2, '<mark>', '</mark>')`.mapWith(String).as('summary'),
          summarySnippet: sql<string>`snippet(youtube_video_virtual, 2, '<mark>', '</mark>', '...', 30)`
            .mapWith(String)
            .as('summary_snippet'),
          sourceLogoUrl: youtubeChannel.logoUrl,
          rank: sql<number>`bm25(youtube_video_virtual, 1.0, 10.0, 1.0)`.mapWith(Number).as('rank'),
        })
        .from(youtubeVideoVirtual)
        .innerJoin(youtubeVideo, eq(youtubeVideo.id, youtubeVideoVirtual.id))
        .innerJoin(youtubeChannel, eq(youtubeChannel.id, youtubeVideo.youtubeChannelId))
        .where(sql`youtube_video_virtual MATCH ${data.query}`);

      const feedEntriesQueried = unionAll(articlesQueried, youtubeVideosQueried).as('feedEntriesQueried');
      const entries = await db.select().from(feedEntriesQueried).orderBy(asc(feedEntriesQueried.rank)).limit(20);

      return { entries };
    } catch (error) {
      logError(GET_FEED_BY_QUERY_ERROR, error);
      throw new Error(GET_FEED_BY_QUERY_ERROR);
    }
  });

function getFeedEntriesFields() {
  return {
    article: {
      type: sql<FeedItemType>`'Article'`.as('type'),
      title: article.title,
      summary: article.summary,
      pubDate: article.pubDate,
      url: article.url,
      urlLabel: sql<FeedItemTypeUrlLabel>`'Read Article'`.as('url_label'),
      thumbnailUrl: sql`null`.mapWith(String).as('thumbnail_url'),
      sourceId: articlePublisher.id,
      sourceName: articlePublisher.name,
      sourceUrl: sql`${articlePublisher.url}`.mapWith(String).as('source_url'),
      sourceLogoUrl: sql`${articlePublisher.logoUrl}`.mapWith(String).as('source_logo_url'),
    },
    youtubeVideo: {
      type: sql<FeedItemType>`'YouTube Video'`.as('type'),
      title: youtubeVideo.title,
      summary: youtubeVideo.summary,
      pubDate: youtubeVideo.pubDate,
      url: sql`'https://www.youtube.com/watch?v=' || ${youtubeVideo.videoId}`.mapWith(String).as('url'),
      urlLabel: sql<FeedItemTypeUrlLabel>`'Watch Video'`.as('url_label'),
      thumbnailUrl: youtubeVideo.thumbnailUrl,
      sourceId: youtubeChannel.id,
      sourceName: youtubeChannel.name,
      sourceUrl: sql`'https://www.youtube.com/@' || ${youtubeChannel.handle}`.mapWith(String).as('source_url'),
      sourceLogoUrl: youtubeChannel.logoUrl,
    },
  };
}

function getFeedEntries() {
  const feedEntriesFields = getFeedEntriesFields();

  const articles = db
    .select(feedEntriesFields.article)
    .from(article)
    .innerJoin(articlePublisher, eq(article.articlePublisherId, articlePublisher.id));

  const youtubeVideos = db
    .select(feedEntriesFields.youtubeVideo)
    .from(youtubeVideo)
    .innerJoin(youtubeChannel, eq(youtubeVideo.youtubeChannelId, youtubeChannel.id));

  return unionAll(articles, youtubeVideos).as('feedEntries');
}
