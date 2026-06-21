import db, { article, type ArticlePublisher } from '@/db';
import { gte } from 'drizzle-orm';
import Parser from 'rss-parser';
import { z } from 'zod';
import { createQueueEventBody } from '../../queue';
import { logError } from '../../utils/logger';

export type DailyScheduledBody = ArticlePublisher & { items: Array<Pick<Parser.Item, 'title' | 'link' | 'pubDate'>> };

export const DAILY_SCHEDULED_NO_ARTICLE_PUBLISHERS_ERROR = 'No Article Publishers Found In Database';
export const DAILY_SCHEDULED_PUBLISHED_DAYS_LIMIT_ERROR = 'Invalid Published Days Limit';
export const DAILY_SCHEDULED_PARSING_ERROR = 'Error Parsing RSS Feed';

const dailyScheduled = async (env: Env) => {
  const daysLimit = z.coerce
    .number()
    .int()
    .positive()
    .transform((value) => Math.floor(Date.now() / 1000) - value * 24 * 60 * 60)
    .safeParse(env.CLOUDFLARE_DAILY_SCHEDULED_PUBLISHED_DAYS_LIMIT);
  if (!daysLimit.success) {
    logError(DAILY_SCHEDULED_PUBLISHED_DAYS_LIMIT_ERROR, z.prettifyError(daysLimit.error));
    return;
  }

  const articlePublishers = await db.query.articlePublisher.findMany({
    with: { articles: { where: gte(article.pubDate, daysLimit.data) } },
  });
  if (!articlePublishers.length) throw new Error(DAILY_SCHEDULED_NO_ARTICLE_PUBLISHERS_ERROR);

  const parser = new Parser();
  const successful: Array<DailyScheduledBody> = [];
  const failed: Array<ArticlePublisher & { error: unknown }> = [];

  (await Promise.allSettled(articlePublishers.map((articlePublisher) => parser.parseURL(articlePublisher.rssUrl)))).forEach(
    (result, index) => {
      const articlePublisher = articlePublishers[index];
      if (result.status !== 'fulfilled') return failed.push({ ...articlePublisher, error: result.reason });

      const items = result.value.items
        .map((item) => ({ title: item.title, link: item.link, pubDate: item.pubDate }))
        .filter((item) => item.pubDate && new Date(item.pubDate).getTime() / 1000 >= daysLimit.data)
        .filter((item) => !articlePublisher.articles.some((article) => article.url === item.link));

      if (items.length) successful.push({ ...articlePublisher, items });
    },
  );

  if (successful.length)
    await env.QUEUE.sendBatch(successful.map((body) => ({ body: createQueueEventBody('daily', body), delaySeconds: 2 })));
  if (failed.length) logError(DAILY_SCHEDULED_PARSING_ERROR, { failed });
};

export default dailyScheduled;
