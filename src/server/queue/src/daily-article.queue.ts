import db, { article, type Article } from '@/db';
import type { DailyArticleScheduledBody } from '../../scheduled/src/daily-article.scheduled';
import { executeWithRetry } from '../../utils/function';
import { logError } from '../../utils/logger';
import { summarize } from '../../utils/prompt';
import { sleep } from '../../utils/sleep';

export const DAILY_ARTICLE_QUEUE_SCRAPE_REQUEST_ERROR = 'Scrape Request Failed';
export const DAILY_ARTICLE_QUEUE_NO_CONTENT_ERROR = 'No Scraped Content';
export const DAILY_ARTICLE_QUEUE_ERROR = 'Daily Article Queue Error';

const handler = async (env: Env, body: DailyArticleScheduledBody) => {
  const successful: Array<Omit<Article, 'id' | 'createdAt'>> = [];
  const failed: Array<DailyArticleScheduledBody['items'][number] & { error: unknown }> = [];

  for (const item of body.items) {
    if (!item.title || !item.link || !item.pubDate) continue;

    const scrapedArticleContent = await executeWithRetry(async () => {
      await sleep();

      const elements: BrowserRunScrapeOptions['elements'] = [{ selector: 'article' }, { selector: 'main' }, { selector: 'body' }];
      const goToOptions: BrowserRunScrapeOptions['gotoOptions'] = { waitUntil: 'networkidle0' };
      const scrapeRequest = await env.BROWSER.quickAction('scrape', { url: String(item.link), gotoOptions: goToOptions, elements });
      if (!scrapeRequest.ok) throw new Error(DAILY_ARTICLE_QUEUE_SCRAPE_REQUEST_ERROR);

      const scrapeResponse = (await scrapeRequest.json()) as BrowserRunScrapeSuccessResponse;
      if (!scrapeResponse.success) throw new Error(DAILY_ARTICLE_QUEUE_SCRAPE_REQUEST_ERROR);

      const scrapeContent = scrapeResponse.result.find((result) => !!result.results.length)?.results[0].text;
      const scrapeContentFormatted = scrapeContent?.replace(/\s+/g, ' ').trim();
      if (!scrapeContentFormatted?.length) throw new Error(DAILY_ARTICLE_QUEUE_NO_CONTENT_ERROR);

      return scrapeContentFormatted;
    });
    if (!scrapedArticleContent.success) {
      failed.push({ ...item, error: scrapedArticleContent.error });
      continue;
    }

    const articleContentSummary = await executeWithRetry(async () => {
      await sleep();
      return summarize(env, 'daily_article_queue_ai_response', scrapedArticleContent.data);
    });
    if (!articleContentSummary.success) {
      failed.push({ ...item, error: articleContentSummary.error });
      continue;
    }

    successful.push({
      articlePublisherId: body.id,
      title: item.title,
      url: item.link,
      pubDate: new Date(item.pubDate).getTime(),
      summary: articleContentSummary.data,
    });
  }

  if (successful.length) await executeWithRetry(() => db.insert(article).values(successful).onConflictDoNothing());
  if (failed.length) logError(DAILY_ARTICLE_QUEUE_ERROR, { failed });
};

export default handler;
