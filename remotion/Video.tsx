import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoManifest} from '../src/types.js';

const SubtitleLayer: React.FC<{manifest: VideoManifest}> = ({manifest}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const second = frame / fps;
  const current = manifest.segmentTimings.find((segment) => second >= segment.startSec && second < segment.endSec);

  if (!current) return null;

  return (
    <div style={{position: 'absolute', left: 80, right: 80, bottom: 56, display: 'flex', justifyContent: 'center'}}>
      <div style={{backgroundColor: 'rgba(0,0,0,0.72)', color: 'white', borderRadius: 16, padding: '18px 24px', fontSize: 30, lineHeight: 1.35, fontFamily: 'Arial, Helvetica, sans-serif', textAlign: 'center'}}>
        <div style={{fontSize: 18, opacity: 0.75, marginBottom: 6}}>{current.speaker.toUpperCase()}</div>
        <div>{current.subtitle}</div>
      </div>
    </div>
  );
};

const SceneVisual: React.FC<{src: string; from: number; durationInFrames: number}> = ({src, from, durationInFrames}) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const entrance = spring({frame: local, fps: 30, config: {damping: 200}});
  const scale = interpolate(local, [0, durationInFrames], [1, 1.06], {extrapolateRight: 'clamp'});

  return (
    <Sequence from={from} durationInFrames={durationInFrames}>
      <AbsoluteFill style={{opacity: entrance}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.38))'}} />
      </AbsoluteFill>
    </Sequence>
  );
};

export const AudioStoryVideo: React.FC<{manifest: VideoManifest}> = ({manifest}) => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {manifest.scenes.map((scene) => (
        <SceneVisual
          key={scene.sceneId}
          src={staticFile(scene.imagePath)}
          from={Math.floor(scene.startSec * fps)}
          durationInFrames={Math.max(1, Math.ceil(scene.durationSec * fps))}
        />
      ))}

      {manifest.segmentTimings.map((segment) => (
        <Sequence key={segment.segmentIndex} from={Math.floor(segment.startSec * fps)} durationInFrames={Math.max(1, Math.ceil(segment.durationSec * fps))}>
          <Audio src={staticFile(segment.audioPath)} />
        </Sequence>
      ))}

      <SubtitleLayer manifest={manifest} />
    </AbsoluteFill>
  );
};
