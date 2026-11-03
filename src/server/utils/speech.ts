import elevenlabs, { type ElevenLabsOutputFormat } from '#/libs/elevenlabs';
import { executeWithRetry } from './function';

export type SpeechSegment = { type: 'speech'; text: string } | { type: 'sound'; key: string };
export type SpeechSegments = Array<SpeechSegment>;

export const SPEECH_SOUND_FETCH_FAILED_ERROR = 'Failed To Fetch Speech Sound';
export const SPEECH_AUDIO_GENERATION_FAILED_ERROR = 'Failed To Generate Speech Audio';
export const SPEECH_MISSING_REQUEST_ID_ERROR = 'Missing Request ID From Speech Audio Generation';

export async function textToSpeech(env: Env, segments: SpeechSegments) {
  const elevenLabsRequestIds: Array<string> = [];
  const elevenLabsAudioChunks: Uint8Array[] = [];
  const sounds = new Map<string, Uint8Array>();

  for (const segment of segments) {
    if (segment.type === 'sound') {
      const cachedSound = sounds.get(segment.key);
      if (cachedSound) {
        elevenLabsAudioChunks.push(cachedSound);
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
      continue;
    }

    const elevenlabsResponse = await executeWithRetry(() => {
      const outputFormat = env.ELEVENLABS_OUTPUT_FORMAT as ElevenLabsOutputFormat;
      const previousRequestIds = elevenLabsRequestIds.slice(-env.ELEVENLABS_MAX_PREVIOUS_REQUEST_IDS);
      return elevenlabs.textToSpeech
        .convert(env.ELEVENLABS_VOICE_ID, { text: segment.text, modelId: env.ELEVENLABS_MODEL_ID, outputFormat, previousRequestIds })
        .withRawResponse();
    });
    if (!elevenlabsResponse.success) throw new Error(SPEECH_AUDIO_GENERATION_FAILED_ERROR, { cause: elevenlabsResponse.error });

    elevenLabsAudioChunks.push(new Uint8Array(await new Response(elevenlabsResponse.data.data).arrayBuffer()));

    const elevenlabsResponseRequestId = elevenlabsResponse.data.rawResponse.headers.get('request-id');
    if (!elevenlabsResponseRequestId) throw new Error(SPEECH_MISSING_REQUEST_ID_ERROR);

    elevenLabsRequestIds.push(elevenlabsResponseRequestId);
  }

  const textToSpeechResponse = new Uint8Array(elevenLabsAudioChunks.reduce((total, chunk) => total + chunk.length, 0));
  elevenLabsAudioChunks.reduce((offset, chunk) => (textToSpeechResponse.set(chunk, offset), offset + chunk.length), 0);
  return textToSpeechResponse;
}

export function speech(text: string): SpeechSegment {
  return { type: 'speech', text };
}

export function sound(key: string): SpeechSegment {
  return { type: 'sound', key };
}
