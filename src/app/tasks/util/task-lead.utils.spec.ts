import { Interval } from '../../@shared/model/interval.types';
import { gapDaysOf, leadOptionsFor } from './task-lead.utils';

const daysOffered = (interval: Interval): number[] =>
  leadOptionsFor(interval)
    .map(({ lead }) => (lead.kind === 'days' ? lead.days : -1))
    .filter((days) => days >= 0);

const boundariesOffered = (interval: Interval): string[] =>
  leadOptionsFor(interval)
    .map(({ lead }) => (lead.kind === 'startOf' ? lead.unit : ''))
    .filter(Boolean);

describe('gapDaysOf', () => {
  it('takes the widest gap in the cycle, wrap-around included', () => {
    expect(gapDaysOf({ unit: 'day', weekdays: [1, 2] })).toBe(6);
    expect(gapDaysOf({ unit: 'day', weekdays: [1, 3, 5, 7] })).toBe(2);
    expect(gapDaysOf({ unit: 'day', weekdays: [1, 2, 3, 4, 5, 6, 7] })).toBe(1);
  });

  it('gives a lone occurrence the whole cycle', () => {
    expect(gapDaysOf({ unit: 'day', weekdays: [4] })).toBe(7);
    expect(gapDaysOf({ unit: 'monthsOfYear', months: [3] })).toBe(360);
  });

  it('measures the months of a year the same way', () => {
    expect(gapDaysOf({ unit: 'monthsOfYear', months: [3, 6] })).toBe(270);
  });

  it('multiplies out an elapsed cadence', () => {
    expect(gapDaysOf({ unit: 'week', every: 2 })).toBe(14);
    expect(gapDaysOf({ unit: 'month', every: 1 })).toBe(30);
  });
});

describe('leadOptionsFor', () => {
  it('enumerates every day a weekday cadence has room for', () => {
    expect(daysOffered({ unit: 'day', weekdays: [1, 2] })).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(daysOffered({ unit: 'day', weekdays: [1, 3, 5, 7] })).toEqual([
      0, 1,
    ]);
  });

  it('leaves a daily chore nothing but the day itself', () => {
    const everyDay: Interval = { unit: 'day', weekdays: [1, 2, 3, 4, 5, 6, 7] };
    expect(daysOffered(everyDay)).toEqual([0]);
    expect(boundariesOffered(everyDay)).toEqual([]);
  });

  it('drops a rung that would reach past the gap', () => {
    expect(daysOffered({ unit: 'week', every: 1 })).toEqual([0, 1, 3]);
    expect(daysOffered({ unit: 'week', every: 2 })).toEqual([0, 1, 3, 7]);
  });

  it('offers a boundary only once its own unit fits in the gap', () => {
    expect(boundariesOffered({ unit: 'week', every: 1 })).toEqual(['week']);
    expect(boundariesOffered({ unit: 'month', every: 1 })).toEqual(['month']);
    expect(boundariesOffered({ unit: 'monthsOfYear', months: [3] })).toEqual([
      'year',
    ]);
    expect(boundariesOffered({ unit: 'monthsOfYear', months: [3, 6] })).toEqual(
      []
    );
  });

  it('never offers a lead that could reach the closing day', () => {
    const cadences: Interval[] = [
      { unit: 'day', weekdays: [1, 2] },
      { unit: 'day', weekdays: [2] },
      { unit: 'week', every: 1 },
      { unit: 'month', every: 3 },
      { unit: 'monthsOfYear', months: [1, 2, 10] },
    ];

    for (const interval of cadences) {
      const gap = gapDaysOf(interval);
      for (const { lead } of leadOptionsFor(interval)) {
        const reach = lead.kind === 'days' ? lead.days : 0;
        expect(reach).toBeLessThan(gap);
      }
    }
  });
});
