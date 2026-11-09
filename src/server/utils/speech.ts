import elevenlabs, { type ElevenLabsWithTimestampsOutputFormat } from '#/libs/elevenlabs';
import { executeWithRetry } from './function';

export type SpeechSegment = { type: 'speech'; text: string } | { type: 'sound'; key: string };
export type SpeechSegments = Array<SpeechSegment>;

export const SPEECH_SOUND_FETCH_FAILED_ERROR = 'Failed To Fetch Speech Sound';
export const SPEECH_AUDIO_GENERATION_FAILED_ERROR = 'Failed To Generate Speech Audio';
export const SPEECH_MISSING_REQUEST_ID_ERROR = 'Missing Request ID From Speech Audio Generation';
export const SPEECH_UNSUPPORTED_OUTPUT_FORMAT_ERROR = 'Unsupported Speech Output Format';

export function speech(text: string): SpeechSegment {
  return { type: 'speech', text };
}

export function sound(key: string): SpeechSegment {
  return { type: 'sound', key };
}

export async function textToSpeech(env: Env, segments: SpeechSegments) {
  const elevenLabsRequestIds: Array<string> = [];
  const elevenLabsAudioChunks: Array<Uint8Array> = [];
  const elevenLabsAudioBytesPerSecond = getElevenLabsAudioBytesPerSecond(env.ELEVENLABS_OUTPUT_FORMAT);
  const soundsSpoken: Array<[number, number]> = [];
  const sounds = new Map<string, Uint8Array>();

  let cursor = 0;

  for (const segment of segments) {
    if (segment.type === 'sound') {
      const cachedSound = sounds.get(segment.key);
      if (cachedSound) {
        elevenLabsAudioChunks.push(cachedSound);
        cursor += cachedSound.length / elevenLabsAudioBytesPerSecond;
        continue;
      }

      const soundResponse = await executeWithRetry(async () => {
        const object = await env.R2.get(segment.key);
        if (!object) throw new Error(SPEECH_SOUND_FETCH_FAILED_ERROR, { cause: segment.key });
        return new Uint8Array(await object.arrayBuffer());
      });
      if (!soundResponse.success) throw new Error(SPEECH_SOUND_FETCH_FAILED_ERROR, { cause: soundResponse.error });

      sounds.set(segment.key, soundResponse.data);
      elevenLabsAudioChunks.push(soundResponse.data);
      cursor += soundResponse.data.length / elevenLabsAudioBytesPerSecond;
      continue;
    }

    const elevenlabsResponse = await executeWithRetry(() =>
      elevenlabs.textToSpeech
        .convertWithTimestamps(env.ELEVENLABS_VOICE_ID, {
          text: segment.text,
          modelId: env.ELEVENLABS_MODEL_ID,
          outputFormat: env.ELEVENLABS_OUTPUT_FORMAT as ElevenLabsWithTimestampsOutputFormat,
          previousRequestIds: elevenLabsRequestIds.slice(-env.ELEVENLABS_MAX_PREVIOUS_REQUEST_IDS),
        })
        .withRawResponse(),
    );
    if (!elevenlabsResponse.success) throw new Error(SPEECH_AUDIO_GENERATION_FAILED_ERROR, { cause: elevenlabsResponse.error });

    const { audioBase64, alignment } = elevenlabsResponse.data.data;
    const audio = Uint8Array.from(atob(audioBase64), (character) => character.charCodeAt(0));
    alignment?.characters.forEach((character, i) => {
      if (character.trim())
        soundsSpoken.push([cursor + alignment.characterStartTimesSeconds[i], cursor + alignment.characterEndTimesSeconds[i]]);
    });
    elevenLabsAudioChunks.push(audio);
    cursor += audio.length / elevenLabsAudioBytesPerSecond;

    const elevenlabsResponseRequestId = elevenlabsResponse.data.rawResponse.headers.get('request-id');
    if (!elevenlabsResponseRequestId) throw new Error(SPEECH_MISSING_REQUEST_ID_ERROR);

    elevenLabsRequestIds.push(elevenlabsResponseRequestId);
  }

  const textToSpeechResponse = new Uint8Array(elevenLabsAudioChunks.reduce((total, chunk) => total + chunk.length, 0));
  elevenLabsAudioChunks.reduce((offset, chunk) => (textToSpeechResponse.set(chunk, offset), offset + chunk.length), 0);
  return { audio: textToSpeechResponse, peaks: getAudioSpeechPeaks(soundsSpoken, cursor) };
}

function getElevenLabsAudioBytesPerSecond(outputFormat: string) {
  const [codec, , bitrate] = outputFormat.split('_');
  if (codec !== 'mp3' || !Number(bitrate)) throw new Error(SPEECH_UNSUPPORTED_OUTPUT_FORMAT_ERROR, { cause: outputFormat });
  return (Number(bitrate) * 1000) / 8;
}

function getAudioSpeechPeaks(spoken: Array<[number, number]>, duration: number) {
  const coverage = new Array<number>(400).fill(0);
  if (duration <= 0) return coverage;

  const bucket = duration / 400;
  for (const [start, end] of spoken) {
    const last = Math.min(400 - 1, Math.floor(end / bucket));
    for (let i = Math.max(0, Math.floor(start / bucket)); i <= last; i++)
      coverage[i] += Math.max(0, Math.min(end, (i + 1) * bucket) - Math.max(start, i * bucket));
  }

  return coverage.map((value) => Math.round(Math.min(1, value / bucket) * 255));
}
