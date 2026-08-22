import { IsoWeekday } from '../../@shared/model/app.types';
import { mockPill } from '../testing/vitals.test-data';
import {
  isEveryDay,
  isTakenOn,
  pillNotificationBlock,
  pillNotificationId,
  pillsOf,
  sortedWeekdays,
  toggledWeekday,
} from './pill.utils';

describe('pill notification ids', () => {
  it('gives every (slot, weekday) pair its own id', () => {
    const ids = [0, 1, 2].flatMap((slot) => pillNotificationBlock(slot));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps one slot’s ids out of the next slot’s block', () => {
    const first = pillNotificationBlock(0);
    const second = pillNotificationBlock(1);

    expect(Math.max(...first)).toBeLessThan(Math.min(...second));
  });

  it('starts above every fixed source id', () => {
    expect(Math.min(...pillNotificationBlock(0))).toBeGreaterThan(99);
  });

  it('covers all seven weekdays', () => {
    const block = pillNotificationBlock(3);

    expect(block).toHaveLength(7);
    expect(block).toContain(pillNotificationId(3, 1));
    expect(block).toContain(pillNotificationId(3, 7));
  });
});

describe('weekday helpers', () => {
  it('recognises the full week', () => {
    expect(isEveryDay([1, 2, 3, 4, 5, 6, 7])).toBe(true);
    expect(isEveryDay([1, 3, 5])).toBe(false);
  });

  it('keeps a picked set in Monday-first order', () => {
    expect(sortedWeekdays([7, 3, 1])).toEqual([1, 3, 7]);
  });

  it('toggles a day on and off', () => {
    const on = toggledWeekday([1, 3], 2 as IsoWeekday);
    expect(on).toEqual([1, 2, 3]);

    expect(toggledWeekday(on, 2 as IsoWeekday)).toEqual([1, 3]);
  });
});

describe('pill lookups', () => {
  it('keeps one profile’s pills apart from another’s', () => {
    const mine = mockPill({ id: 'a' });
    const cats = mockPill({ id: 'b', profileId: 'cat' });

    expect(pillsOf([mine, cats], 'profile-1')).toEqual([mine]);
  });

  it('answers taken-today per pill and per day', () => {
    const intakes = [{ pillId: 'a', takenOn: '2026-08-22' }];

    expect(isTakenOn(intakes, 'a', '2026-08-22')).toBe(true);
    expect(isTakenOn(intakes, 'a', '2026-08-21')).toBe(false);
    expect(isTakenOn(intakes, 'b', '2026-08-22')).toBe(false);
  });
});
