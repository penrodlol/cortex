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

      const prompt = `
  Summarize the content and identify its primary technical topic.
  
  Summary requirements:
  - Write exactly one paragraph.
  - Begin immediately with the central claim, finding, announcement, or technical takeaway.
  - Write naturally, as if written by an experienced engineer.
  - Avoid generic introductions such as "This article", "This blog post", or "This guide".
  - Focus on the most important information and omit minor details.
  
  Topic requirements:
  - Identify the single primary technical subject discussed in the content.
  - Prefer the most specific technology, framework, platform, protocol, library, language, tool, architecture pattern, or engineering concept that best represents the content.
  - If multiple technologies are mentioned, choose the one the content is primarily about.
  - Remove version numbers and version qualifiers.
  - Prefer specific technologies over broader categories.
  - Return null if no clear technical topic exists.
  
  Topic classification priority:
  1. Specific library, framework, SDK, or tool
  2. Specific cloud service or platform
  3. Programming language
  4. Protocol, specification, or standard
  5. Architecture pattern or engineering concept
  6. General technical domain
  
  Choose the highest-priority category that accurately represents the content.
  
  Content:
  ${scrapeContentFormatted}
  `;

      const aiResponseSchema = z.object({ summary: z.string(), topic: z.string().nullable() });
      const aiRunResponse = await env.AI.run(env.CLOUDFLARE_AI_MODEL, {
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_schema', json_schema: { ...z.toJSONSchema(aiResponseSchema), name: 'daily_queue_ai_response' } },
      });
      const aiRunResponseText = (aiRunResponse as ChatCompletionsOutput)?.choices?.[0]?.message?.content;
      const aiRunResponseJson = aiResponseSchema.safeParse(JSON.parse(aiRunResponseText ?? '{}'));
      if (!aiRunResponseJson?.success) {
        logError(DAILY_QUEUE_AI_RESPONSE_ERROR, { aiRunResponseText, error: z.prettifyError(aiRunResponseJson.error), item });
        failed.push(item);
        continue;
      }

      success.push({
        siteId: body.id,
        title: item.title,
        url: item.link,
        pubDate: new Date(item.pubDate).getTime(),
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
