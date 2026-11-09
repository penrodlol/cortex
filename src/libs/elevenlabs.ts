import { ElevenLabs, ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { env } from 'cloudflare:workers';

export type ElevenLabsWithTimestampsOutputFormat = ElevenLabs.TextToSpeechConvertWithTimestampsRequestOutputFormat;

export default new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY });
