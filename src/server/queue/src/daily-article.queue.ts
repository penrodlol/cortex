import { summarize } from '#/server/utils/prompt';
import db, { article, type Article } from '@/db';
import type { DailyArticleScheduledBody } from '../../scheduled/src/daily-article.scheduled';
import { logError } from '../../utils/logger';

export const DAILY_ARTICLE_QUEUE_SCRAPE_REQUEST_ERROR = 'Scrape Request Failed';
export const DAILY_ARTICLE_QUEUE_NO_CONTENT_ERROR = 'No Scraped Content';

const handler = async (env: Env, body: DailyArticleScheduledBody, retryLimit: number) => {
  const success: Array<Omit<Article, 'id' | 'createdAt'>> = [];

  for (const item of body.items) {
    if (!item.title || !item.link || !item.pubDate) continue;

    const scrapedArticleContent = await getScrapedArticleContent(env, item.link, retryLimit);
    if (!scrapedArticleContent) continue;
    const articleContentSummary = await summarize(env, 'daily_article_queue_ai_response', scrapedArticleContent, retryLimit);
    if (!articleContentSummary) continue;

    success.push({
      articlePublisherId: body.id,
      title: item.title,
      url: item.link,
      pubDate: Math.floor(new Date(item.pubDate).getTime() / 1000),
      summary: articleContentSummary,
    });
  }

  if (success.length) await db.insert(article).values(success).onConflictDoNothing();
};

async function getScrapedArticleContent(env: Env, url: string, retryLimit: number) {
  const elements: BrowserRunScrapeOptions['elements'] = [{ selector: 'article' }, { selector: 'main' }, { selector: 'body' }];
  const goToOptions: BrowserRunScrapeOptions['gotoOptions'] = { waitUntil: 'networkidle0' };

  let retry = 0;

  while (retry < retryLimit) {
    const scrapeRequest = await env.BROWSER.quickAction('scrape', { url, gotoOptions: goToOptions, elements });
    if (!scrapeRequest.ok) {
      logError(DAILY_ARTICLE_QUEUE_SCRAPE_REQUEST_ERROR, { url, status: scrapeRequest.status, statusText: scrapeRequest.statusText });
      retry++;
      continue;
    }

    const scrapeResponse = (await scrapeRequest.json()) as BrowserRunScrapeSuccessResponse;
    if (!scrapeResponse.success) {
      logError(DAILY_ARTICLE_QUEUE_SCRAPE_REQUEST_ERROR, { url, scrapeResponse });
      retry++;
      continue;
    }

    const scrapeContent = scrapeResponse.result.find((result) => !!result.results.length)?.results[0].text;
    const scrapeContentFormatted = scrapeContent?.replace(/\s+/g, ' ').trim();
    if (!scrapeContentFormatted?.length) {
      logError(DAILY_ARTICLE_QUEUE_NO_CONTENT_ERROR, { url, scrapeResponse });
      retry++;
      continue;
    }

    return scrapeContentFormatted;
  }
}

export default handler;
