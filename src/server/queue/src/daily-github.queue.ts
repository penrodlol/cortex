import db, {
  githubRepository,
  githubRepositoryLanguage,
  githubRepositoryPublisher,
  type GithubRepository,
  type GithubRepositoryLanguage,
  type GithubRepositoryPublisher,
} from '@/db';
import octokit, { type GetRepositoryResponse } from '@/libs/octokit';
import { sql } from 'drizzle-orm';
import type { DailyGithubScheduledBody } from '../../scheduled/src/daily-github.scheduled';
import { executeWithRetry } from '../../utils/function';
import { logError, logInfo } from '../../utils/logger';
import { sleep } from '../../utils/sleep';

export const DAILY_GITHUB_QUEUE_REPOSITORY_FETCH_ERROR = 'Error Fetching Github Repository';
export const DAILY_GITHUB_QUEUE_REPOSITORY_LANGUAGE_INSERT_ERROR = 'Error Inserting Github Repository Language';
export const DAILY_GITHUB_QUEUE_REPOSITORY_PUBLISHER_INSERT_ERROR = 'Error Inserting Github Repository Publisher';
export const DAILY_GITHUB_QUEUE_ERROR = 'Daily Github Queue Error';
export const DAILY_GITHUB_QUEUE_COMPLETED = 'Daily Github Queue Completed';

const handler = async (body: DailyGithubScheduledBody) => {
  const githubRepositoryLanguages = await executeWithRetry(() => db.select().from(githubRepositoryLanguage));
  if (!githubRepositoryLanguages.success) throw new Error(DAILY_GITHUB_QUEUE_ERROR);
  const githubRepositoryLanguagesMap = new Map(githubRepositoryLanguages.data.map((language) => [language.name, language]));

  const githubRepositoryPublishers = await executeWithRetry(() => db.select().from(githubRepositoryPublisher));
  if (!githubRepositoryPublishers.success) throw new Error(DAILY_GITHUB_QUEUE_ERROR);
  const githubRepositoryPublishersMap = new Map(githubRepositoryPublishers.data.map((publisher) => [publisher.name, publisher]));

  const successful = new Map<string, Omit<GithubRepository, 'id' | 'updatedAt' | 'createdAt'>>();
  const failed: Array<DailyGithubScheduledBody['items'][number] & { error: unknown }> = [];

  for (const item of body.items) {
    await sleep();
    const githubRepository = await executeWithRetry(async () => {
      const githubRepository = await octokit.repos.get({ owner: item.publisher, repo: item.repo });
      if (!githubRepository || !githubRepository.data) throw new Error(DAILY_GITHUB_QUEUE_REPOSITORY_FETCH_ERROR);
      return githubRepository.data;
    });
    if (!githubRepository.success) {
      failed.push({ ...item, error: githubRepository.error });
      continue;
    }

    if (!githubRepository.data.language || !githubRepository.data.description) continue;

    const githubRepositoryLanguageId = await getGithubRepositoryLanguageId(githubRepositoryLanguagesMap, githubRepository.data.language);
    if (!githubRepositoryLanguageId) {
      failed.push({ ...item, error: DAILY_GITHUB_QUEUE_REPOSITORY_LANGUAGE_INSERT_ERROR });
      continue;
    }

    const githubRepositoryPublisherId = await getGithubRepositoryPublisherId(githubRepositoryPublishersMap, githubRepository.data);
    if (!githubRepositoryPublisherId) {
      failed.push({ ...item, error: DAILY_GITHUB_QUEUE_REPOSITORY_PUBLISHER_INSERT_ERROR });
      continue;
    }

    successful.set(githubRepository.data.html_url, {
      title: githubRepository.data.name,
      summary: githubRepository.data.description,
      url: githubRepository.data.html_url,
      stars: githubRepository.data.stargazers_count,
      forks: githubRepository.data.forks_count,
      watchers: githubRepository.data.watchers_count,
      githubRepositoryLanguageId,
      githubRepositoryPublisherId,
    });
  }

  const successfulChunked = Array.from(successful.values());
  for (let i = 0; i < successfulChunked.length; i += 10) {
    const githubRepositories = await executeWithRetry(() =>
      db
        .insert(githubRepository)
        .values(successfulChunked.slice(i, i + 10))
        .onConflictDoUpdate({
          target: [githubRepository.url],
          set: {
            title: sql`excluded.title`,
            summary: sql`excluded.summary`,
            stars: sql`excluded.stars`,
            forks: sql`excluded.forks`,
            watchers: sql`excluded.watchers`,
            updatedAt: new Date().getTime(),
            githubRepositoryLanguageId: sql`excluded.github_repository_language_id`,
            githubRepositoryPublisherId: sql`excluded.github_repository_publisher_id`,
          },
        }),
    );
    if (!githubRepositories.success) logError(DAILY_GITHUB_QUEUE_ERROR, githubRepositories.error);
  }
  if (failed.length) logError(DAILY_GITHUB_QUEUE_ERROR, { failed });

  logInfo(DAILY_GITHUB_QUEUE_COMPLETED, { successful: successful.size, failed: failed.length });
};

async function getGithubRepositoryLanguageId(map: Map<string, GithubRepositoryLanguage>, name: string) {
  if (map.has(name)) return String(map.get(name)?.id);
  const githubRepositoryLanguageData = await executeWithRetry(() =>
    db
      .insert(githubRepositoryLanguage)
      .values({ name })
      .onConflictDoUpdate({ target: [githubRepositoryLanguage.name], set: { name: sql`excluded.name` } })
      .returning()
      .get(),
  );
  return githubRepositoryLanguageData.success ? githubRepositoryLanguageData.data.id : null;
}

async function getGithubRepositoryPublisherId(map: Map<string, GithubRepositoryPublisher>, data: GetRepositoryResponse) {
  if (map.has(data.owner.login)) return String(map.get(data.owner.login)?.id);
  const githubRepositoryPublisherData = await executeWithRetry(() =>
    db
      .insert(githubRepositoryPublisher)
      .values({ name: data.owner.login, url: data.owner.html_url, logoUrl: data.owner.avatar_url })
      .onConflictDoUpdate({ target: [githubRepositoryPublisher.url], set: { url: sql`excluded.url` } })
      .returning()
      .get(),
  );
  return githubRepositoryPublisherData.success ? githubRepositoryPublisherData.data.id : null;
}

export default handler;
