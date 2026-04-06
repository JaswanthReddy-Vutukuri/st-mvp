import fs from 'node:fs/promises';
import path from 'node:path';
import {writeMockSpeechWav, estimateSpeechDurationSec} from '../lib/mock-audio.js';
import type {EpisodeScript, ScriptSegment, Speaker} from '../types.js';

interface TimestampAlignment {
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

const voiceIdForSpeaker = (speaker: Speaker) => process.env[`VOICE_ID_${speaker.toUpperCase()}`];

export const synthesizeSegment = async (
  episode: EpisodeScript,
  segment: ScriptSegment,
  segmentIndex: number,
  outDir: string,
): Promise<{audioPath: string; durationSec: number}> => {
  const audioPath = path.join(outDir, `segment-${String(segmentIndex).padStart(3, '0')}.wav`);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = voiceIdForSpeaker(segment.speaker);

  if (!apiKey || !voiceId) {
    const durationSec = await writeMockSpeechWav(audioPath, segment.speaker, segment.text);
    return {audioPath, durationSec};
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: segment.text,
      model_id: process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2',
      language_code: episode.language,
      output_format: process.env.ELEVENLABS_OUTPUT_FORMAT ?? 'mp3_44100_128',
    }),
  });

  if (!response.ok) {
    const fallback = await writeMockSpeechWav(audioPath, segment.speaker, segment.text);
    return {audioPath, durationSec: fallback};
  }

  const json = (await response.json()) as {
    audio_base64: string;
    normalized_alignment?: TimestampAlignment;
    alignment?: TimestampAlignment;
  };

  const binary = Buffer.from(json.audio_base64, 'base64');
  await fs.writeFile(audioPath.replace(/\.wav$/, '.mp3'), binary);

  const alignment = json.normalized_alignment ?? json.alignment;
  const durationSec = alignment?.character_end_times_seconds.at(-1) ?? estimateSpeechDurationSec(segment.text);

  return {audioPath: audioPath.replace(/\.wav$/, '.mp3'), durationSec};
};
