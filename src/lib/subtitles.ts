import type {SegmentTiming} from '../types.js';

const formatTime = (totalSeconds: number) => {
  const ms = Math.floor((totalSeconds % 1) * 1000);
  const totalWhole = Math.floor(totalSeconds);
  const hours = Math.floor(totalWhole / 3600);
  const minutes = Math.floor((totalWhole % 3600) / 60);
  const seconds = totalWhole % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

export const buildSrt = (timings: SegmentTiming[]) =>
  timings
    .map((timing, index) => `${index + 1}\n${formatTime(timing.startSec)} --> ${formatTime(timing.endSec)}\n${timing.speaker.toUpperCase()}: ${timing.subtitle}`)
    .join('\n\n');
