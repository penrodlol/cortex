import { ElevenLabs, ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { env } from 'cloudflare:workers';

export type ElevenLabsOutputFormat = ElevenLabs.TextToSpeechConvertRequestOutputFormat;

export default new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY });
