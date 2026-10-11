import { Track } from '../model/music.types';
import { nextIndex, shuffled, toQueue, withoutEntry } from './queue.utils';

const track = { id: 'same', title: 'Same' } as Track;

describe('queue', () => {
  it('gives the same track twice two entries', () => {
    let id = 0;
    const queue = toQueue([track, track], () => `entry-${id++}`);

    expect(withoutEntry(queue, 'entry-0')).toEqual([
      { entryId: 'entry-1', track },
    ]);
  });

  it.each([
    [0, 3, 'off', 1],
    [2, 3, 'off', undefined],
    [2, 3, 'all', 0],
    [1, 3, 'one', 1],
  ] as const)(
    'advances %s of %s with repeat %s to %s',
    (index, length, repeat, expected) => {
      expect(nextIndex(index, length, repeat)).toBe(expected);
    }
  );

  it('shuffles without losing or duplicating an item', () => {
    const items = [1, 2, 3, 4, 5];

    expect(shuffled(items, () => 0.3).toSorted()).toEqual(items);
  });
});
