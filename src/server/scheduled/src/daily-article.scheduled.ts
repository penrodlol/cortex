import db, { article, type ArticlePublisher } from '@/db';
import { gte } from 'drizzle-orm';
import Parser from 'rss-parser';
import { createQueueEventBody } from '../../queue';
import { executeWithRetry } from '../../utils/function';
import { logError } from '../../utils/logger';

export type DailyArticleScheduledBody = ArticlePublisher & { items: Array<Pick<Parser.Item, 'title' | 'link' | 'pubDate'>> };

export const DAILY_ARTICLE_SCHEDULED_NO_ARTICLE_PUBLISHERS_ERROR = 'No Article Publishers Found In Database';
export const DAILY_ARTICLE_SCHEDULED_ERROR = 'Daily Article Scheduled Error';

const dailyArticleScheduled = async (env: Env, daysAgo: number) => {
  const articlePublishers = await executeWithRetry(() =>
    db.query.articlePublisher.findMany({ with: { articles: { where: gte(article.pubDate, daysAgo) } } }),
  );
  if (!articlePublishers.success || !articlePublishers.data.length) throw new Error(DAILY_ARTICLE_SCHEDULED_NO_ARTICLE_PUBLISHERS_ERROR);

  const parser = new Parser();
  const successful: Array<DailyArticleScheduledBody> = [];
  const failed: Array<ArticlePublisher & { error: unknown }> = [];

  for (const articlePublisher of articlePublishers.data) {
    const items = await executeWithRetry(async () => {
      const result = await parser.parseURL(articlePublisher.rssUrl);
      return result.items
        .map((item) => ({ title: item.title, link: item.link, pubDate: item.pubDate }))
        .filter((item) => item.pubDate && new Date(item.pubDate).getTime() >= daysAgo)
        .filter((item) => !articlePublisher.articles.some((article) => article.url === item.link));
    });
    if (!items.success) {
      failed.push({ ...articlePublisher, error: items.error });
      continue;
    }
    if (items.data.length) successful.push({ ...articlePublisher, items: items.data });
  }

  if (successful.length)
    await executeWithRetry(() =>
      env.QUEUE.sendBatch(successful.map((body) => ({ body: createQueueEventBody('daily-article', body), delaySeconds: 2 }))),
    );
  if (failed.length) logError(DAILY_ARTICLE_SCHEDULED_ERROR, { failed });
};

export default dailyArticleScheduled;
