import db, { article, type ArticlePublisher } from '@/db';
import puppeteer from '@cloudflare/puppeteer';
import { gte } from 'drizzle-orm';
import Parser from 'rss-parser';
import { createQueueEventBody } from '../../queue';
import { executeWithRetry } from '../../utils/function';
import { logError } from '../../utils/logger';

export type DailyArticleScheduledBody = ArticlePublisher & { items: Array<Pick<Parser.Item, 'title' | 'link' | 'pubDate'>> };

export const DAILY_ARTICLE_SCHEDULED_NO_ARTICLE_PUBLISHERS_ERROR = 'No Article Publishers Found In Database';
export const DAILY_ARTICLE_SCHEDULED_RENDER_ERROR = 'Error Rendering Article Publisher RSS Feed';
export const DAILY_ARTICLE_SCHEDULED_ERROR = 'Daily Article Scheduled Error';

const dailyArticleScheduled = async (env: Env, daysAgo: number) => {
  const articlePublishers = await executeWithRetry(() =>
    db.query.articlePublisher.findMany({ with: { articles: { where: gte(article.pubDate, daysAgo) } } }),
  );
  if (!articlePublishers.success || !articlePublishers.data.length) throw new Error(DAILY_ARTICLE_SCHEDULED_NO_ARTICLE_PUBLISHERS_ERROR);

  const parser = new Parser();
  const successful: Array<DailyArticleScheduledBody> = [];
  const failed: Array<ArticlePublisher & { error: unknown }> = [];

  const browser = await puppeteer.launch(env.BROWSER);
  const page = await browser.newPage();

  for (const articlePublisher of articlePublishers.data) {
    const items = await executeWithRetry(async () => {
      const articlePublisherRssPage = await page.goto(articlePublisher.rssUrl, { waitUntil: 'domcontentloaded' });
      if (!articlePublisherRssPage || !articlePublisherRssPage.ok()) throw new Error(DAILY_ARTICLE_SCHEDULED_RENDER_ERROR);

      const articlePublisherRssContent = await articlePublisherRssPage.text();
      const articlePublisherRssContentParsed = await parser.parseString(articlePublisherRssContent);
      return articlePublisherRssContentParsed.items
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

  await browser.close();

  if (successful.length)
    await executeWithRetry(() =>
      env.QUEUE.sendBatch(successful.map((body) => ({ body: createQueueEventBody('daily-article', body), delaySeconds: 2 }))),
    );
  if (failed.length) logError(DAILY_ARTICLE_SCHEDULED_ERROR, { failed });
};

export default dailyArticleScheduled;
