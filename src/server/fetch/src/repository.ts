import db, { githubRepository, githubRepositoryLanguage, githubRepositoryPublisher } from '@/db';
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logError } from '../../utils/logger';

export type GetRepositoryMetadataResponse = NonNullable<Awaited<ReturnType<typeof getRepositoryMetadata>>>;
export type GetRepositoryRequest = z.infer<typeof getRepositoryRequestSchema>;
export type GetRepositoryResponse = NonNullable<Awaited<ReturnType<typeof getRepository>>>;

export const GET_REPOSITORY_METADATA_ERROR = 'Error Retrieving Repository Metadata';
export const GET_REPOSITORY_ERROR = 'Error Retrieving Repository';

export const REPOSITORY_CACHE_TIME = 5 * 60 * 1000;
export const GET_REPOSITORY_PAGE_SIZE = 20;
export const GET_REPOSITORY_DEFAULT_REQUEST: GetRepositoryRequest = { page: 1 };

export const getRepositoryRequestSchema = z.object({
  page: z.number().positive().optional().default(1),
  languageIds: z.array(z.string()).optional(),
  publisherIds: z.array(z.string()).optional(),
});

export const getRepositoryMetadataQueryOptions = () =>
  queryOptions({
    queryKey: ['repositoryMetadata'],
    queryFn: () => getRepositoryMetadata(),
    staleTime: REPOSITORY_CACHE_TIME,
  });

export const getRepositoryQueryOptions = (data: GetRepositoryRequest) =>
  queryOptions({
    queryKey: ['repository', ...Object.values(data)],
    queryFn: () => getRepository({ data }),
    staleTime: REPOSITORY_CACHE_TIME,
    placeholderData: (previousData) => previousData,
  });

export const getRepositoryMetadata = createServerFn().handler(async () => {
  try {
    const [languages, publishers] = await Promise.all([
      db
        .select({ id: githubRepositoryLanguage.id, name: githubRepositoryLanguage.name })
        .from(githubRepositoryLanguage)
        .orderBy(asc(sql`name collate nocase`)),
      db
        .select({ id: githubRepositoryPublisher.id, name: githubRepositoryPublisher.name })
        .from(githubRepositoryPublisher)
        .orderBy(asc(sql`name collate nocase`)),
    ]);

    return { languages, publishers };
  } catch (error) {
    logError(GET_REPOSITORY_METADATA_ERROR, error);
    throw new Error(GET_REPOSITORY_METADATA_ERROR);
  }
});

export const getRepository = createServerFn({ method: 'POST' })
  .validator(getRepositoryRequestSchema)
  .handler(async ({ data }) => {
    try {
      const entries = await db
        .select({
          title: githubRepository.title,
          summary: githubRepository.summary,
          url: githubRepository.url,
          updatedAt: githubRepository.updatedAt,
          languageId: githubRepositoryLanguage.id,
          languageName: githubRepositoryLanguage.name,
          sourceId: githubRepositoryPublisher.id,
          sourceName: githubRepositoryPublisher.name,
          sourceUrl: githubRepositoryPublisher.url,
          sourceLogoUrl: githubRepositoryPublisher.logoUrl,
        })
        .from(githubRepository)
        .innerJoin(githubRepositoryLanguage, eq(githubRepository.githubRepositoryLanguageId, githubRepositoryLanguage.id))
        .innerJoin(githubRepositoryPublisher, eq(githubRepository.githubRepositoryPublisherId, githubRepositoryPublisher.id))
        .where(
          and(
            data.languageIds?.length ? inArray(githubRepository.githubRepositoryLanguageId, data.languageIds) : undefined,
            data.publisherIds?.length ? inArray(githubRepository.githubRepositoryPublisherId, data.publisherIds) : undefined,
          ),
        )
        .orderBy(desc(githubRepository.updatedAt), asc(githubRepository.title))
        .limit(GET_REPOSITORY_PAGE_SIZE + 1)
        .offset(data.page === 1 ? 0 : (data.page - 1) * GET_REPOSITORY_PAGE_SIZE);

      return {
        entries: entries.slice(0, GET_REPOSITORY_PAGE_SIZE),
        hasPreviousPage: data.page > 1,
        hasNextPage: entries.length === GET_REPOSITORY_PAGE_SIZE + 1,
      };
    } catch (error) {
      logError(GET_REPOSITORY_ERROR, error);
      throw new Error(GET_REPOSITORY_ERROR);
    }
  });
