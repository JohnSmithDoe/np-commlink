import dayjs from 'dayjs';
import { ITrackingItem, ITrackingState } from '../../model/tracking.types';
import {
  selectRunningTrackingItem,
  selectSessionsByDayAndName,
  selectTrackingData,
  selectTrackingItemCount,
  selectTrackingTime,
} from './tracking.selector';

const track = (over: Partial<ITrackingItem> = {}): ITrackingItem => ({
  id: Math.random().toString(36).slice(2),
  name: 'Task',
  createdAt: '2026-01-01',
  state: 'stopped',
  ...over,
});

const state = (over: Partial<ITrackingState> = {}): ITrackingState => ({
  title: 'Time tracking',
  items: [],
  categories: [],
  mode: 'alphabetical',
  sessions: [],
  sessionsViewId: 'all',
  ...over,
});

describe('tracking.selector', () => {
  describe('selectTrackingData (grouping)', () => {
    it('merges same-name entries within a monthly bucket', () => {
      const sessions = [
        track({
          name: 'A',
          startTime: '2026-05-01T09:00:00',
          trackedTimeInSeconds: 3600,
        }),
        track({
          name: 'A',
          startTime: '2026-05-20T09:00:00',
          trackedTimeInSeconds: 1800,
        }),
        track({
          name: 'B',
          startTime: '2026-05-10T09:00:00',
          trackedTimeInSeconds: 600,
        }),
      ];
      const grouped = selectTrackingData.projector(
        state({ sessions }),
        'monthly'
      );
      const byName = Object.fromEntries(
        grouped.map((g) => [g.name, g.trackedTimeInSeconds])
      );
      expect(byName['A']).toBe(5400);
      expect(byName['B']).toBe(600);
    });
  });

  it('selectRunningTrackingItem finds the running item', () => {
    const running = track({ id: 'r', state: 'running' });
    const result = selectRunningTrackingItem.projector(
      state({ items: [track({ state: 'stopped' }), running] })
    );
    expect(result?.id).toBe('r');
  });

  it('selectTrackingTime sums the live items into a clock string', () => {
    const result = selectTrackingTime.projector(
      state({
        items: [
          track({ trackedTimeInSeconds: 3600 }),
          track({ trackedTimeInSeconds: 61 }),
        ],
      })
    );
    expect(result).toBe('01:01:01');
  });

  describe('selectSessionsByDayAndName (chart series)', () => {
    it("buckets today's hours by name across a 21-day window", () => {
      const today = dayjs().hour(10).minute(0).second(0);
      const series = selectSessionsByDayAndName.projector([
        track({
          name: 'A',
          startTime: today.format(),
          trackedTimeInSeconds: 3600,
        }),
        track({
          name: 'A',
          startTime: today.format(),
          trackedTimeInSeconds: 1800,
        }),
      ]);

      expect(series.days).toHaveLength(21);
      const a = series.series.find((s) => s.name === 'A')!;
      expect(a.hours).toHaveLength(21);
      // today is the last day in the window
      expect(a.hours[20]).toBeCloseTo(1.5, 5);
    });
  });
});

describe('selectTrackingItemCount', () => {
  it('counts the list items', () => {
    expect(
      selectTrackingItemCount.projector({
        items: [track()],
      } as ITrackingState)
    ).toBe(1);
  });

  it('falls back to 0 for an unregistered slice', () => {
    expect(selectTrackingItemCount.projector(undefined as never)).toBe(0);
  });
});
