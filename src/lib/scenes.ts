import path from 'node:path';
import {ensureDir} from './fs.js';
import type {Scene, SegmentTiming} from '../types.js';

const scenePrompt = (timings: SegmentTiming[]) => {
  const first = timings[0];
  const speakers = [...new Set(timings.map((t) => t.speaker))].join(', ');
  const textHint = timings.map((t) => t.text).join(' ');
  return [
    'Warm Indian educational storybook illustration, soft cinematic lighting, consistent family-friendly visual style.',
    `Location: ${first.location ?? 'Indian family home interior'}.`,
    `Visible speakers: ${speakers}.`,
    `Mood: ${first.emotion ?? 'calm'}.`,
    `Topic: ${first.topic ?? 'family conversation'}.`,
    `Action hint: ${textHint}`,
    'No text in image. Clean composition. Suitable for YouTube educational storytelling.',
  ].join(' ');
};

export const groupIntoScenes = async (timings: SegmentTiming[], imageDir: string): Promise<Scene[]> => {
  await ensureDir(imageDir);
  const scenes: Scene[] = [];
  let bucket: SegmentTiming[] = [];

  const flush = async () => {
    if (bucket.length === 0) return;
    const first = bucket[0];
    const last = bucket[bucket.length - 1];
    const sceneId = `scene-${String(scenes.length + 1).padStart(3, '0')}`;
    const imagePath = path.join(imageDir, `${sceneId}.svg`);
    const imagePrompt = scenePrompt(bucket);
    const scene: Scene = {
      sceneId,
      startSec: first.startSec,
      endSec: last.endSec,
      durationSec: last.endSec - first.startSec,
      imagePath,
      imagePrompt,
      location: first.location ?? 'Indian family home interior',
      topic: first.topic ?? 'family conversation',
      speakers: [...new Set(bucket.map((b) => b.speaker))],
      caption: first.text,
    };
    scenes.push(scene);
    bucket = [];
  };

  for (const timing of timings) {
    const prev = bucket.at(-1);
    if (!prev) {
      bucket.push(timing);
      continue;
    }

    const duration = timing.endSec - bucket[0].startSec;
    const sameLocation = prev.location === timing.location;
    const sameTopic = prev.topic === timing.topic;

    if (sameLocation && sameTopic && duration <= 12) {
      bucket.push(timing);
      continue;
    }

    await flush();
    bucket.push(timing);
  }

  await flush();
  return scenes;
};
