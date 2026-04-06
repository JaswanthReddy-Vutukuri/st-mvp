import fs from 'node:fs/promises';
import path from 'node:path';

export const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, {recursive: true});
};

export const writeJson = async (filePath: string, value: unknown) => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
};

export const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
};
