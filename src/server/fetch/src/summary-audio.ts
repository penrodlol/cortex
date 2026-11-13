import db, { summaryAudio } from '#/db';
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { setCacheHeaders } from '../../utils/cache';
import { logError } from '../../utils/logger';

export type GetSummaryAudioRequest = z.infer<typeof getSummaryAudioRequestSchema>;
export type GetSummaryAudioResponse = NonNullable<Awaited<ReturnType<typeof getSummaryAudio>>>;

export const GET_SUMMARY_AUDIO_ERROR = 'Error Retrieving Summary Audio';

export const SUMMARY_AUDIO_CACHE_TIME = 5 * 60 * 1000;
export const GET_SUMMARY_AUDIO_DEFAULT_REQUEST: GetSummaryAudioRequest = {};

export const getSummaryAudioRequestSchema = z.object({ id: z.uuid().optional() });

export const getSummaryAudioQueryOptions = (data: GetSummaryAudioRequest) =>
  queryOptions({
    queryKey: ['summaryAudio', ...Object.values(data)],
    queryFn: () => getSummaryAudio({ data }),
    staleTime: SUMMARY_AUDIO_CACHE_TIME,
    placeholderData: (previousData) => previousData,
  });

export const getSummaryAudio = createServerFn()
  .validator(getSummaryAudioRequestSchema)
  .handler(async ({ data }) => {
    try {
      const entriesPaginatedWindow = sql`over (order by ${summaryAudio.createdAt} desc)`;
      const entriesPaginated = db
        .select({
          id: summaryAudio.id,
          audioUrl: summaryAudio.audioUrl,
          audioPeaks: summaryAudio.audioPeaks,
          createdAt: summaryAudio.createdAt,
          previous: sql<string | null>`lead(${summaryAudio.id}) ${entriesPaginatedWindow}`.as('previous_id'),
          next: sql<string | null>`lag(${summaryAudio.id}) ${entriesPaginatedWindow}`.as('next_id'),
        })
        .from(summaryAudio)
        .as('entries_paginated');

      const entry = await db
        .select()
        .from(entriesPaginated)
        .where(data.id ? eq(entriesPaginated.id, data.id) : undefined)
        .orderBy(desc(entriesPaginated.createdAt))
        .limit(1)
        .get();
      if (!entry) return null;

      setCacheHeaders();

      return { ...entry, audioPeaks: entry?.audioPeaks.map((value) => value / 255) ?? [] };
    } catch (error) {
      logError(GET_SUMMARY_AUDIO_ERROR, error);
      throw new Error(GET_SUMMARY_AUDIO_ERROR);
    }
  });
