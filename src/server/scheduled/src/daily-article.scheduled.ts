import db, { article, type ArticlePublisher } from '@/db';
import { gte } from 'drizzle-orm';
import Parser from 'rss-parser';
import { createQueueEventBody } from '../../queue';
import { logError } from '../../utils/logger';

export type DailyArticleScheduledBody = ArticlePublisher & { items: Array<Pick<Parser.Item, 'title' | 'link' | 'pubDate'>> };

export const DAILY_ARTICLE_SCHEDULED_NO_ARTICLE_PUBLISHERS_ERROR = 'No Article Publishers Found In Database';
export const DAILY_ARTICLE_SCHEDULED_PARSING_ERROR = 'Error Parsing RSS Feed';

const dailyArticleScheduled = async (env: Env, daysAgo: number) => {
  const articlePublishers = await db.query.articlePublisher.findMany({ with: { articles: { where: gte(article.pubDate, daysAgo) } } });
  if (!articlePublishers.length) throw new Error(DAILY_ARTICLE_SCHEDULED_NO_ARTICLE_PUBLISHERS_ERROR);

  const parser = new Parser();
  const successful: Array<DailyArticleScheduledBody> = [];
  const failed: Array<ArticlePublisher & { error: unknown }> = [];

  (await Promise.allSettled(articlePublishers.map((articlePublisher) => parser.parseURL(articlePublisher.rssUrl)))).forEach(
    (result, index) => {
      const articlePublisher = articlePublishers[index];
      if (result.status !== 'fulfilled') return failed.push({ ...articlePublisher, error: result.reason });

      const items = result.value.items
        .map((item) => ({ title: item.title, link: item.link, pubDate: item.pubDate }))
        .filter((item) => item.pubDate && new Date(item.pubDate).getTime() / 1000 >= daysAgo)
        .filter((item) => !articlePublisher.articles.some((article) => article.url === item.link));

      if (items.length) successful.push({ ...articlePublisher, items });
    },
  );

  if (successful.length)
    await env.QUEUE.sendBatch(successful.map((body) => ({ body: createQueueEventBody('daily-article', body), delaySeconds: 2 })));
  if (failed.length) logError(DAILY_ARTICLE_SCHEDULED_PARSING_ERROR, { failed });
};

export default dailyArticleScheduled;
