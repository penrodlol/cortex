import db, { article, articlePublisher, youtubeChannel, youtubeVideo } from '#/db';
import { and, desc, eq, gte, isNull } from 'drizzle-orm/sql';
import { createQueueEventBody } from '../../queue';
import { executeWithRetry } from '../../utils/function';
import { logInfo } from '../../utils/logger';

export type DailySummaryAudioScheduledBody = { items: Extract<Awaited<ReturnType<typeof getEntries>>, { success: true }>['data'] };

export const DAILY_SUMMARY_AUDIO_SCHEDULED_NO_FEED_ENTRIES_ERROR = 'No Feed Entries Found In Database';
export const DAILY_SUMMARY_AUDIO_SCHEDULED_COMPLETED = 'Daily Summary Audio Scheduled Completed';

const dailySummaryAudioScheduled = async (env: Env, daysAgo: number) => {
  const entries = await getEntries(daysAgo - 3 * 60 * 60 * 1000);
  if (!entries.success) throw new Error(DAILY_SUMMARY_AUDIO_SCHEDULED_NO_FEED_ENTRIES_ERROR, { cause: entries.error });

  if (Object.keys(entries.data.articles).length > 0 || Object.keys(entries.data.youtubeVideos).length > 0)
    await executeWithRetry(() => env.QUEUE.send(createQueueEventBody('daily-summary-audio', { items: entries.data })));

  logInfo(DAILY_SUMMARY_AUDIO_SCHEDULED_COMPLETED, {
    successful: Object.values(entries.data.articles).flat().length + Object.values(entries.data.youtubeVideos).flat().length,
  });
};

async function getEntries(daysAgo: number) {
  const articles = await executeWithRetry(() =>
    db
      .select({
        id: article.id,
        title: article.title,
        summary: article.summary,
        publisherName: articlePublisher.name,
      })
      .from(article)
      .innerJoin(articlePublisher, eq(article.articlePublisherId, articlePublisher.id))
      .where(and(isNull(article.summaryAudioId), gte(article.pubDate, daysAgo)))
      .orderBy(desc(article.pubDate)),
  );
  if (!articles.success) return { success: false, error: articles.error } as const;

  const youtubeVideos = await executeWithRetry(() =>
    db
      .select({
        id: youtubeVideo.id,
        title: youtubeVideo.title,
        summary: youtubeVideo.summary,
        publisherName: youtubeChannel.name,
      })
      .from(youtubeVideo)
      .innerJoin(youtubeChannel, eq(youtubeVideo.youtubeChannelId, youtubeChannel.id))
      .where(and(isNull(youtubeVideo.summaryAudioId), gte(youtubeVideo.pubDate, daysAgo)))
      .orderBy(desc(youtubeVideo.pubDate)),
  );
  if (!youtubeVideos.success) return { success: false, error: youtubeVideos.error } as const;

  return { success: true, data: { articles: getEntryItems(articles.data), youtubeVideos: getEntryItems(youtubeVideos.data) } } as const;
}

function getEntryItems<T extends { publisherName: string }>(items: T[]) {
  return items.reduce(
    (acc, { publisherName, ...item }) => ({ ...acc, [publisherName]: [...(acc[publisherName] ?? []), item] }),
    {} as Record<string, Omit<T, 'publisherName'>[]>,
  );
}

export default dailySummaryAudioScheduled;
