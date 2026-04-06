export type Speaker =
  | 'father'
  | 'mother'
  | 'son'
  | 'daughter'
  | 'aunty'
  | 'uncle'
  | 'grandfather'
  | 'grandmother';

export interface ScriptSegment {
  speaker: Speaker;
  text: string;
  emotion?: string;
  location?: string;
  topic?: string;
}

export interface EpisodeScript {
  episodeId: string;
  title: string;
  language: string;
  fps?: number;
  segments: ScriptSegment[];
}

export interface SegmentTiming {
  segmentIndex: number;
  speaker: Speaker;
  text: string;
  audioPath: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  subtitle: string;
  location?: string;
  emotion?: string;
  topic?: string;
}

export interface Scene {
  sceneId: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  imagePath: string;
  imagePrompt: string;
  location: string;
  topic: string;
  speakers: Speaker[];
  caption?: string;
}

export interface VideoManifest {
  episodeId: string;
  title: string;
  fps: number;
  totalDurationSec: number;
  width: number;
  height: number;
  segmentTimings: SegmentTiming[];
  scenes: Scene[];
}
