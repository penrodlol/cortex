import db, { youtubeVideo, type YoutubeChannel } from '@/db';
import youtube from '@/libs/youtube';
import type { youtube_v3 } from '@googleapis/youtube';
import { gte } from 'drizzle-orm';
import { createQueueEventBody } from '../../queue';
import { executeWithRetry } from '../../utils/function';
import { logError, logInfo } from '../../utils/logger';
import { sleep } from '../../utils/sleep';

export type DailyYoutubeScheduledBody = YoutubeChannel & { items: Array<youtube_v3.Schema$PlaylistItem> };

export const DAILY_YOUTUBE_SCHEDULED_NO_CHANNELS_FOUND = 'No YouTube Channels Found In Database';
export const DAILY_YOUTUBE_SCHEDULED_ERROR = 'Daily Youtube Scheduled Error';
export const DAILY_YOUTUBE_SCHEDULED_COMPLETED = 'Daily Youtube Scheduled Completed';

const dailyYoutubeScheduled = async (env: Env, daysAgo: number) => {
  const youtubeChannels = await executeWithRetry(async () =>
    db.query.youtubeChannel.findMany({ with: { videos: { where: gte(youtubeVideo.pubDate, daysAgo) } } }),
  );
  if (!youtubeChannels.success || !youtubeChannels.data.length) throw new Error(DAILY_YOUTUBE_SCHEDULED_NO_CHANNELS_FOUND);

  const successful: Array<DailyYoutubeScheduledBody> = [];
  const failed: Array<YoutubeChannel & { error: unknown }> = [];

  for (const youtubeChannel of youtubeChannels.data) {
    const youtubeChannelWithContent = await executeWithRetry(async () => {
      await sleep();
      return youtube.channels.list({ part: ['id', 'contentDetails'], forHandle: youtubeChannel.handle });
    });
    if (!youtubeChannelWithContent.success) {
      failed.push({ ...youtubeChannel, error: youtubeChannelWithContent.error });
      continue;
    }

    const youtubeChannelAllVideos = await executeWithRetry(async () => {
      await sleep();
      const youtubeChannelAllVideos = await youtube.playlistItems.list({
        part: ['id', 'snippet'],
        playlistId: youtubeChannelWithContent.data.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads,
        maxResults: 20,
      });
      return youtubeChannelAllVideos.data.items?.filter(
        (item) => item.snippet?.publishedAt && new Date(item.snippet.publishedAt).getTime() >= daysAgo,
      );
    });
    if (!youtubeChannelAllVideos.success) {
      failed.push({ ...youtubeChannel, error: youtubeChannelAllVideos.error });
      continue;
    }

    const youtubeChannelVideos: NonNullable<(typeof youtubeChannelAllVideos)['data']> = [];

    for (const youtubeChannelVideo of youtubeChannelAllVideos.data ?? []) {
      const youtubeChannelVideoId = youtubeChannelVideo.snippet?.resourceId?.videoId;
      if (!youtubeChannelVideoId) continue;

      const isYoutubeChannelVideoValid = await executeWithRetry(async () => {
        await sleep();
        const request = await fetch(`https://www.youtube.com/shorts/${youtubeChannelVideoId}`, { method: 'HEAD', redirect: 'manual' });
        return request.status !== 200 && !youtubeChannel.videos.some((video) => video.videoId === youtubeChannelVideoId);
      });
      if (!isYoutubeChannelVideoValid.success) {
        failed.push({ ...youtubeChannel, error: isYoutubeChannelVideoValid.error });
        continue;
      }
      if (isYoutubeChannelVideoValid.data) youtubeChannelVideos.push(youtubeChannelVideo);
    }

    if (youtubeChannelVideos.length) successful.push({ ...youtubeChannel, items: youtubeChannelVideos });
  }

  if (successful.length)
    await executeWithRetry(() =>
      env.QUEUE.sendBatch(successful.map((body) => ({ body: createQueueEventBody('daily-youtube', body), delaySeconds: 2 }))),
    );
  if (failed.length) logError(DAILY_YOUTUBE_SCHEDULED_ERROR, { failed });

  logInfo(DAILY_YOUTUBE_SCHEDULED_COMPLETED, {
    successful: successful.reduce((acc, body) => acc + body.items.length, 0),
    failed: failed.length,
  });
};

export default dailyYoutubeScheduled;
