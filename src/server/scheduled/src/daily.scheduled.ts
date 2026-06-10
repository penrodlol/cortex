import db, { site, type Site } from '@/db';
import Parser from 'rss-parser';
import { z } from 'zod';
import { createQueueEventBody } from '../../queue';
import { logError } from '../../utils/logger';

export type DailyScheduledBody = Site & { items: Array<Pick<Parser.Item, 'title' | 'link' | 'pubDate'>> };

export const DAILY_SCHEDULED_NO_SITES_ERROR = 'No Sites Found In Database';
export const DAILY_SCHEDULED_PUBLISHED_DAYS_LIMIT_ERROR = 'Invalid Published Days Limit';
export const DAILY_SCHEDULED_PARSING_ERROR = 'Error Parsing RSS Feed';

const dailyScheduled = async (env: Env) => {
  const sites = await db.select().from(site);
  if (!sites.length) throw new Error(DAILY_SCHEDULED_NO_SITES_ERROR);

  const daysLimit = z.coerce.number().int().positive().safeParse(env.CLOUDFLARE_DAILY_SCHEDULED_PUBLISHED_DAYS_LIMIT);
  if (!daysLimit.success) {
    logError(DAILY_SCHEDULED_PUBLISHED_DAYS_LIMIT_ERROR, z.prettifyError(daysLimit.error));
    return;
  }

  const parser = new Parser();
  const successful: Array<DailyScheduledBody> = [];
  const failed: Array<Site & { error: unknown }> = [];

  (await Promise.allSettled(sites.map((site) => parser.parseURL(`${site.url}/${site.rssEndpoint}`)))).forEach((result, index) => {
    const site = sites[index];
    if (result.status !== 'fulfilled') return failed.push({ ...site, error: result.reason });

    const items = result.value.items
      .map((item) => ({ title: item.title, link: item.link, pubDate: item.pubDate }))
      .filter((item) => new Date(String(item.pubDate)) > new Date(Date.now() - daysLimit.data * 24 * 60 * 60 * 1000));

    if (items.length) successful.push({ ...site, items });
  });

  if (successful.length)
    await env.QUEUE.sendBatch(successful.map((body) => ({ body: createQueueEventBody('daily', body), delaySeconds: 2 })));
  if (failed.length) logError(DAILY_SCHEDULED_PARSING_ERROR, { failed });
};

export default dailyScheduled;
