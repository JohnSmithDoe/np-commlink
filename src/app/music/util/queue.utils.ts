import { uuidv4 } from '../../@shared/util/app.utils';
import { QueueEntry, RepeatMode, Track } from '../model/music.types';

export const toQueue = (
  tracks: readonly Track[],
  createId: () => string = uuidv4
): QueueEntry[] => tracks.map((track) => ({ entryId: createId(), track }));

export const nextIndex = (
  index: number,
  length: number,
  repeat: RepeatMode
): number | undefined => {
  if (repeat === 'one') return index;
  if (index + 1 < length) return index + 1;
  return repeat === 'all' && length > 0 ? 0 : undefined;
};

export const previousIndex = (index: number): number => Math.max(0, index - 1);

export const shuffled = <T>(
  items: readonly T[],
  random: () => number = Math.random
): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const index_ = Math.floor(random() * (index + 1));
    [result[index], result[index_]] = [result[index_] as T, result[index] as T];
  }
  return result;
};

export const withoutEntry = (
  queue: readonly QueueEntry[],
  entryId: string
): QueueEntry[] => queue.filter((entry) => entry.entryId !== entryId);
