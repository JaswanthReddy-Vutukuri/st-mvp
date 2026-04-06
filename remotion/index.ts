import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {AudioStoryVideo} from './Video.js';
import {loadManifest} from './load-manifest.js';

const Root: React.FC<{manifestPath: string}> = ({manifestPath}) => {
  const manifest = loadManifest(manifestPath);
  const durationInFrames = Math.ceil(manifest.totalDurationSec * manifest.fps);

  return (
    <Composition
      id="AudioStoryVideo"
      component={AudioStoryVideo}
      durationInFrames={durationInFrames}
      fps={manifest.fps}
      width={manifest.width}
      height={manifest.height}
      defaultProps={{manifest}}
    />
  );
};

registerRoot(Root);
