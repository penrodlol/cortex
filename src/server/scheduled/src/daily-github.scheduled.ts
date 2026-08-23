import db, { githubRepositoryLanguage } from '#/db';
import puppeteer from '@cloudflare/puppeteer';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createQueueEventBody } from '../../queue';
import { executeWithRetry } from '../../utils/function';
import { logError, logInfo } from '../../utils/logger';
import { sleep } from '../../utils/sleep';

export type DailyGithubScheduledBody = { items: Array<{ publisher: string; repo: string }> };

export const DAILY_GITHUB_SCHEDULED_RENDER_ERROR = 'Error Rendering Github Trending Page';
export const DAILY_GITHUB_SCHEDULED_ERROR = 'Daily Github Scheduled Error';
export const DAILY_GITHUB_SCHEDULED_COMPLETED = 'Daily Github Scheduled Completed';

const dailyGithubScheduled = async (env: Env) => {
  const githubRepositoryTrendingLanguages = await executeWithRetry(() =>
    db.select().from(githubRepositoryLanguage).where(eq(githubRepositoryLanguage.watchTrending, 1)),
  );
  if (!githubRepositoryTrendingLanguages.success)
    throw new Error(DAILY_GITHUB_SCHEDULED_ERROR, { cause: githubRepositoryTrendingLanguages.error });

  const githubRepositoryTrendingLanguageUrls = [
    env.GITHUB_TRENDING_URL,
    ...githubRepositoryTrendingLanguages.data.map((lang) => `${env.GITHUB_TRENDING_URL}/${encodeURIComponent(lang.name.toLowerCase())}`),
  ];

  const browser = await puppeteer.launch(env.BROWSER);
  const page = await browser.newPage();

  const successful: Array<DailyGithubScheduledBody> = [];
  const failed: Array<{ url: string; error: unknown }> = [];

  for (const githubRepositoryTrendingLanguageUrl of githubRepositoryTrendingLanguageUrls) {
    const items = await executeWithRetry(async () => {
      await sleep();
      const githubRepositoryTrendingLanguagePage = await page.goto(githubRepositoryTrendingLanguageUrl, { waitUntil: 'domcontentloaded' });
      if (!githubRepositoryTrendingLanguagePage || !githubRepositoryTrendingLanguagePage.ok())
        throw new Error(DAILY_GITHUB_SCHEDULED_RENDER_ERROR);

      const githubRepositoryTrendingLanguageEntryUrls = await z
        .array(z.string().nullable())
        .safeParseAsync(await page.$$eval(env.GITHUB_TRENDING_ELEMENT_SELECTOR, (els) => els.map((el) => el.getAttribute('href'))));
      if (!githubRepositoryTrendingLanguageEntryUrls.success) throw new Error(DAILY_GITHUB_SCHEDULED_RENDER_ERROR);

      return githubRepositoryTrendingLanguageEntryUrls.data
        .map((item) => ({ publisher: item?.split('/')[1], repo: item?.split('/')[2] }))
        .filter((item): item is { publisher: string; repo: string } => Boolean(item.publisher) && Boolean(item.repo));
    });
    if (!items.success) {
      failed.push({ url: githubRepositoryTrendingLanguageUrl, error: items.error });
      continue;
    }
    if (items.data.length) successful.push({ items: items.data });
  }

  await browser.close();

  if (successful.length)
    await executeWithRetry(() =>
      env.QUEUE.sendBatch(successful.map((body) => ({ body: createQueueEventBody('daily-github', body), delaySeconds: 2 }))),
    );
  if (failed.length) logError(DAILY_GITHUB_SCHEDULED_ERROR, { failed });

  logInfo(DAILY_GITHUB_SCHEDULED_COMPLETED, {
    successful: successful.reduce((acc, body) => acc + body.items.length, 0),
    failed: failed.length,
  });
};

export default dailyGithubScheduled;
