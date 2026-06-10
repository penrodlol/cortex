import db, { post, type Post } from '@/db';
import { z } from 'zod';
import type { DailyScheduledBody } from '../../scheduled/src/daily.scheduled';
import { logError } from '../../utils/logger';

export const DAILY_QUEUE_INVALID_RETRY_LIMIT_ERROR = 'Invalid Retry Limit';
export const DAILY_QUEUE_SCRAPE_REQUEST_ERROR = 'Scrape Request Failed';
export const DAILY_QUEUE_NO_CONTENT_ERROR = 'No Scraped Content';
export const DAILY_QUEUE_AI_RESPONSE_ERROR = 'AI Response Failed';

const dailyQueue = async (env: Env, body: DailyScheduledBody) => {
  const success: Array<Omit<Post, 'id' | 'createdAt'>> = [];
  const retryLimit = z.coerce.number().int().nonnegative().safeParse(env.CLOUDFLARE_DAILY_QUEUE_RETRY_LIMIT);
  if (!retryLimit.success) {
    logError(DAILY_QUEUE_INVALID_RETRY_LIMIT_ERROR, z.prettifyError(retryLimit.error));
    return;
  }

  let items = body.items;
  let retry = 0;

  while (retry <= retryLimit.data && items.length) {
    const failed: typeof body.items = [];

    for (const item of items) {
      if (!item.title || !item.link || !item.pubDate) continue;

      const elements: BrowserRunScrapeOptions['elements'] = [{ selector: 'article' }, { selector: 'main' }, { selector: 'body' }];
      const goToOptions: BrowserRunScrapeOptions['gotoOptions'] = { waitUntil: 'networkidle0' };
      const scrapeRequest = await env.BROWSER.quickAction('scrape', { url: item.link, gotoOptions: goToOptions, elements });
      if (!scrapeRequest.ok) {
        logError(DAILY_QUEUE_SCRAPE_REQUEST_ERROR, { status: scrapeRequest.status, statusText: scrapeRequest.statusText, item });
        failed.push(item);
        continue;
      }

      const scrapeResponse = (await scrapeRequest.json()) as BrowserRunScrapeSuccessResponse;
      if (!scrapeResponse.success) {
        logError(DAILY_QUEUE_SCRAPE_REQUEST_ERROR, item);
        failed.push(item);
        continue;
      }

      const scrapeContent = scrapeResponse.result.find((result) => !!result.results.length)?.results[0].text;
      const scrapeContentFormatted = scrapeContent?.replace(/\s+/g, ' ').trim();
      if (!scrapeContentFormatted?.length) {
        logError(DAILY_QUEUE_NO_CONTENT_ERROR, item);
        failed.push(item);
        continue;
      }

      const prompt =
        'Summarize the content below and respond with valid JSON only.\n' +
        'Use this exact shape:\n' +
        '{"summary":"string","topic":"string"}\n' +
        'Rules:\n' +
        '- summary must be 1 paragraph.\n' +
        '- summary must read like it was written by a human.\n' +
        '- summary must begin immediately with the core thesis or the most critical fact.\n' +
        '- summary must not include generic filler phrases (for example, "This article, this guide...").\n' +
        '- topic must be the single most referenced technical library in the content.\n' +
        '- topic must not include version numbers or version qualifiers (for example, use "React" instead of "React 19").\n' +
        '- topic must be null if there is no technical library mentioned in the content.\n' +
        '- Do not include markdown, code fences, or any text outside JSON.\n\n' +
        'Content:\n' +
        scrapeContentFormatted;

      const aiRunResponse = await env.AI.run(env.CLOUDFLARE_AI_MODEL, { messages: [{ role: 'user', content: prompt }] });
      const aiRunResponseText = (aiRunResponse as ChatCompletionsOutput)?.choices?.[0]?.message?.content;
      const aiRunResponseJson = z
        .object({ summary: z.string(), topic: z.string().nullable() })
        .safeParse(JSON.parse(aiRunResponseText ?? '{}'));
      if (!aiRunResponseJson?.success) {
        logError(DAILY_QUEUE_AI_RESPONSE_ERROR, { aiRunResponseText, error: z.prettifyError(aiRunResponseJson.error), item });
        failed.push(item);
        continue;
      }

      success.push({
        siteId: body.id,
        title: item.title,
        url: item.link,
        pubDate: new Date(item.pubDate).toISOString(),
        summary: aiRunResponseJson.data.summary,
        topic: aiRunResponseJson.data.topic,
      });
    }

    items = failed;
    retry++;
  }

  if (success.length) await db.insert(post).values(success).onConflictDoNothing();
};

export default dailyQueue;
