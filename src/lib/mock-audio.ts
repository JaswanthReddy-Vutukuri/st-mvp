import fs from 'node:fs/promises';

const sampleRate = 24000;

const speakerFrequency = (speaker: string) => {
  switch (speaker) {
    case 'father': return 210;
    case 'mother': return 260;
    case 'son': return 320;
    case 'daughter': return 350;
    case 'aunty': return 250;
    case 'uncle': return 220;
    case 'grandfather': return 180;
    case 'grandmother': return 230;
    default: return 240;
  }
};

const clamp16 = (value: number) => Math.max(-32768, Math.min(32767, value));

export const estimateSpeechDurationSec = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1.5, words / 2.6);
};

export const writeMockSpeechWav = async (outputPath: string, speaker: string, text: string) => {
  const durationSec = estimateSpeechDurationSec(text);
  const totalSamples = Math.floor(durationSec * sampleRate);
  const dataSize = totalSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  const frequency = speakerFrequency(speaker);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.min(1, i / 1200) * Math.min(1, (totalSamples - i) / 1200);
    const tone = Math.sin(2 * Math.PI * frequency * t);
    const wobble = Math.sin(2 * Math.PI * 4 * t) * 0.15;
    const sample = clamp16((tone * 0.18 + wobble) * envelope * 32767);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  await fs.writeFile(outputPath, buffer);
  return durationSec;
};
