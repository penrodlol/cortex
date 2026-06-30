import db, { article, articlePublisher, summary, youtubeChannel, youtubeVideo } from '@/db';
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { logError } from '../utils/logger';

export type GetFeedRequest = z.infer<typeof getFeedRequestSchema>;
export type GetFeedResponse = NonNullable<Awaited<ReturnType<typeof getFeed>>>;

export const GET_FEED_ERROR = 'Error Retrieving Feed';

export const GET_FEED_PAGE_SIZE = 15;
export const GET_FEED_CACHE_TIME = 5 * 60 * 1000;
export const GET_FEED_DEFAULT_REQUEST: GetFeedRequest = { page: 1 };

export const getFeedRequestSchema = z.object({ page: z.number().positive().optional().default(1) });

export const getFeedQueryOptions = (data: GetFeedRequest) =>
  queryOptions({ queryKey: ['feed', ...Object.values(data)], queryFn: () => getFeed({ data }), staleTime: GET_FEED_CACHE_TIME });

export const getFeed = createServerFn({ method: 'POST' })
  .validator(getFeedRequestSchema)
  .handler(async ({ data }) => {
    try {
      const total = await db.select().from(summary).where(eq(summary.name, 'total_articles_and_youtube_videos')).get();

      const articles = db
        .select({
          title: article.title,
          summary: article.summary,
          pubDate: article.pubDate,
          url: article.url,
          thumbnailUrl: sql`null`.mapWith(String).as('thumbnail_url'),
          source: articlePublisher.name,
          sourceUrl: sql`${articlePublisher.url}`.mapWith(String).as('source_url'),
        })
        .from(article)
        .innerJoin(articlePublisher, eq(article.articlePublisherId, articlePublisher.id));

      const youtubeVideos = db
        .select({
          title: youtubeVideo.title,
          summary: youtubeVideo.summary,
          pubDate: youtubeVideo.pubDate,
          url: sql`'https://www.youtube.com/watch?v=' || ${youtubeVideo.videoId}`.mapWith(String).as('url'),
          thumbnailUrl: youtubeVideo.thumbnailUrl,
          source: youtubeChannel.name,
          sourceUrl: sql`'https://www.youtube.com/@' || ${youtubeChannel.handle}`.mapWith(String).as('source_url'),
        })
        .from(youtubeVideo)
        .innerJoin(youtubeChannel, eq(youtubeVideo.youtubeChannelId, youtubeChannel.id));

      const articlesAndYoutubeVideos = unionAll(articles, youtubeVideos).as('articlesAndYoutubeVideos');

      const entries = await db
        .select()
        .from(articlesAndYoutubeVideos)
        .orderBy(desc(articlesAndYoutubeVideos.pubDate), asc(articlesAndYoutubeVideos.title))
        .limit(GET_FEED_PAGE_SIZE)
        .offset((data.page - 1) * GET_FEED_PAGE_SIZE);

      return { entries, hasNextPage: data.page * GET_FEED_PAGE_SIZE < (total?.value ?? 0), hasPreviousPage: data.page > 1 };
    } catch (error) {
      logError(GET_FEED_ERROR, error);
      throw new Error(GET_FEED_ERROR);
    }
  });
