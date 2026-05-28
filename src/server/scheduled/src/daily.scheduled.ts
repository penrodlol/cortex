import db, { site, type Site } from '@/db';
import Parser from 'rss-parser';

export type DailyScheduledBody = Site & { items: Array<Pick<Parser.Item, 'title' | 'link' | 'pubDate'>> };

export const DAILY_SCHEDULED_NO_SITES_ERROR = 'No Sites Found In Database';
export const DAILY_SCHEDULED_PARSING_ERROR = 'Error Parsing RSS Feed';

const dailyScheduled = async (env: Env) => {
  const sites = await db.select().from(site);
  if (!sites.length) throw new Error(DAILY_SCHEDULED_NO_SITES_ERROR);

  const parser = new Parser();
  const successful: Array<DailyScheduledBody> = [];
  const failed: Array<Site & { error: unknown }> = [];

  (await Promise.allSettled(sites.map((site) => parser.parseURL(`${site.url}/${site.rssEndpoint}`)))).forEach((result, index) => {
    const site = sites[index];
    if (result.status !== 'fulfilled') return failed.push({ ...site, error: result.reason });
    successful.push({ ...site, items: result.value.items.map((item) => ({ title: item.title, link: item.link, pubDate: item.pubDate })) });
  });

  // TODO: Publish batch to queue

  if (failed.length) console.error({ message: DAILY_SCHEDULED_PARSING_ERROR, data: { failed } });
};

export default dailyScheduled;
