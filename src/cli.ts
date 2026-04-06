import fs from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {readJson, writeJson, ensureDir} from './lib/fs.js';
import {synthesizeSegment} from './providers/elevenlabs.js';
import {groupIntoScenes} from './lib/scenes.js';
import {writePlaceholderSceneImage} from './lib/placeholder-image.js';
import {buildSrt} from './lib/subtitles.js';
import type {EpisodeScript, SegmentTiming, VideoManifest} from './types.js';

const argValue = (flag: string) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const build = async () => {
  const inputPath = argValue('--input');
  const outDir = argValue('--out') ?? 'public/generated/demo';
  if (!inputPath) throw new Error('Missing --input');

  const episode = await readJson<EpisodeScript>(inputPath);
  const fps = episode.fps ?? 30;
  const audioDir = path.join(outDir, 'audio');
  const imageDir = path.join(outDir, 'images');
  await ensureDir(audioDir);
  await ensureDir(imageDir);

  const timings: SegmentTiming[] = [];
  let cursor = 0;

  for (const [index, segment] of episode.segments.entries()) {
    const {audioPath, durationSec} = await synthesizeSegment(episode, segment, index, audioDir);
    const publicAudioPath = path.relative(path.resolve('public'), path.resolve(audioPath)).replace(/\\/g, '/');
    timings.push({
      segmentIndex: index,
      speaker: segment.speaker,
      text: segment.text,
      audioPath: publicAudioPath,
      startSec: cursor,
      endSec: cursor + durationSec,
      durationSec,
      subtitle: segment.text,
      location: segment.location,
      emotion: segment.emotion,
      topic: segment.topic,
    });
    cursor += durationSec;
  }

  const scenes = await groupIntoScenes(timings, imageDir);
  for (const scene of scenes) {
    await writePlaceholderSceneImage(scene);
    scene.imagePath = path.relative(path.resolve('public'), path.resolve(scene.imagePath)).replace(/\\/g, '/');
  }

  const manifest: VideoManifest = {
    episodeId: episode.episodeId,
    title: episode.title,
    fps,
    totalDurationSec: cursor,
    width: 1280,
    height: 720,
    segmentTimings: timings,
    scenes,
  };

  await writeJson(path.join(outDir, 'manifest.json'), manifest);
  await fs.writeFile(path.join(outDir, 'subtitles.srt'), buildSrt(timings), 'utf8');
  await writeJson(path.join(outDir, 'render-props.json'), {manifestPath: path.resolve(outDir, 'manifest.json')});

  console.log(`Built manifest at ${path.join(outDir, 'manifest.json')}`);
};

const render = async () => {
  const manifestPath = argValue('--manifest');
  const outPath = argValue('--out') ?? 'output/final.mp4';
  if (!manifestPath) throw new Error('Missing --manifest');

  const entry = path.resolve('remotion/index.ts');
  const serveUrl = await bundle({entryPoint: entry});
  const inputProps = {manifestPath: path.resolve(manifestPath)};
  const composition = await selectComposition({serveUrl, id: 'AudioStoryVideo', inputProps});

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: path.resolve(outPath),
    inputProps,
  });

  console.log(`Rendered video to ${outPath}`);
};

const command = process.argv[2];

if (command === 'build') {
  await build();
} else if (command === 'render') {
  await render();
} else {
  console.log('Usage: tsx src/cli.ts <build|render> [options]');
}
