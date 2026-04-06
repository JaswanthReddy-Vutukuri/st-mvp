import fs from 'node:fs';
import type {VideoManifest} from '../src/types.js';

export const loadManifest = (manifestPath: string): VideoManifest => {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw) as VideoManifest;
};
