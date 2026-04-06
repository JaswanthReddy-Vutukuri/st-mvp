import fs from 'node:fs/promises';
import type {Scene} from '../types.js';

const wrap = (text: string, width = 52) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 8);
};

export const writePlaceholderSceneImage = async (scene: Scene) => {
  const lines = wrap(scene.imagePrompt);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2d1b69" />
        <stop offset="100%" stop-color="#11998e" />
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)" />
    <rect x="70" y="70" width="1140" height="580" rx="28" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.28)" />
    <text x="110" y="150" fill="#ffffff" font-size="38" font-family="Arial, Helvetica, sans-serif" font-weight="700">${scene.sceneId}</text>
    <text x="110" y="205" fill="#d9f1ff" font-size="28" font-family="Arial, Helvetica, sans-serif">${scene.location}</text>
    ${lines.map((line, index) => `<text x="110" y="${280 + index * 42}" fill="#ffffff" font-size="26" font-family="Arial, Helvetica, sans-serif">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`).join('')}
    <text x="110" y="620" fill="#d9f1ff" font-size="22" font-family="Arial, Helvetica, sans-serif">Speakers: ${scene.speakers.join(', ')}</text>
  </svg>`;
  await fs.writeFile(scene.imagePath, svg.trim(), 'utf8');
};
