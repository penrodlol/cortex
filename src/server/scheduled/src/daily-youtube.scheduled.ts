import db, { youtubeVideo, type YoutubeChannel } from '@/db';
import youtube from '@/libs/youtube';
import type { youtube_v3 } from '@googleapis/youtube';
import { gte } from 'drizzle-orm';
import { createQueueEventBody } from '../../queue';
import { logError } from '../../utils/logger';

export type DailyYoutubeScheduledBody = YoutubeChannel & { items: Array<youtube_v3.Schema$SearchResult> };

export const DAILY_YOUTUBE_SCHEDULED_NO_CHANNELS_FOUND = 'No YouTube Channels Found In Database';
export const DAILY_YOUTUBE_SCHEDULED_NO_CHANNEL_ID_FOUND = 'No YouTube Channel ID Found For Handle';
export const DAILY_YOUTUBE_SCHEDULED_NO_VIDEO_ID_FOUND = 'No YouTube Video ID Found For Video';
export const DAILY_YOUTUBE_SCHEDULED_ERROR = 'Error Occurred While Processing YouTube Channels';

const dailyYoutubeScheduled = async (env: Env, daysAgo: number) => {
  const youtubeChannels = await db.query.youtubeChannel.findMany({ with: { videos: { where: gte(youtubeVideo.pubDate, daysAgo) } } });
  if (!youtubeChannels.length) throw new Error(DAILY_YOUTUBE_SCHEDULED_NO_CHANNELS_FOUND);

  const successful: Array<DailyYoutubeScheduledBody> = [];
  const failed: Array<YoutubeChannel & { error: unknown }> = [];

  for (const youtubeChannel of youtubeChannels) {
    const youtubeChannelWithId = await youtube.channels.list({ part: ['id'], forHandle: youtubeChannel.handle });
    const youtubeChannelId = youtubeChannelWithId.data.items?.[0]?.id;
    if (!youtubeChannelId) {
      failed.push({ ...youtubeChannel, error: DAILY_YOUTUBE_SCHEDULED_NO_CHANNEL_ID_FOUND });
      continue;
    }

    const youtubeVideosData = await youtube.search.list({
      channelId: youtubeChannelId,
      part: ['id', 'snippet'],
      type: ['video'],
      order: 'date',
      maxResults: 20,
      publishedAfter: new Date(daysAgo * 1000).toISOString(),
    });
    const youtubeAllVideos = youtubeVideosData.data.items;
    if (!youtubeAllVideos?.length) continue;

    const youtubeVideos: typeof youtubeAllVideos = [];

    for (const youtubeVideo of youtubeAllVideos) {
      if (!youtubeVideo.id?.videoId) {
        failed.push({ ...youtubeChannel, error: DAILY_YOUTUBE_SCHEDULED_NO_VIDEO_ID_FOUND });
        continue;
      }

      const youtubeVideoId = youtubeVideo.id.videoId;
      const isYoutubeVideoShort = await fetch(`https://www.youtube.com/shorts/${youtubeVideoId}`, { method: 'HEAD', redirect: 'manual' });
      if (isYoutubeVideoShort.status !== 200 && !youtubeChannel.videos.some((video) => video.videoId === youtubeVideoId))
        youtubeVideos.push(youtubeVideo);
    }

    if (youtubeVideos.length) successful.push({ ...youtubeChannel, items: youtubeVideos });
  }

  if (successful.length)
    await env.QUEUE.sendBatch(successful.map((body) => ({ body: createQueueEventBody('daily-youtube', body), delaySeconds: 2 })));
  if (failed.length) logError(DAILY_YOUTUBE_SCHEDULED_ERROR, { failed });
};

export default dailyYoutubeScheduled;
