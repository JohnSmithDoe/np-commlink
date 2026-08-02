import dayjs from 'dayjs';
import { TrackingItem, TrackingState } from '../model/tracking.types';
import {
  selectLiveChartSessions,
  selectRunningTrackingItem,
  selectTrackingItemCount,
  selectTrackingTime,
} from './tracking.selector';

const track = (over: Partial<TrackingItem> = {}): TrackingItem => ({
  id: Math.random().toString(36).slice(2),
  name: 'Task',
  createdAt: '2026-01-01',
  state: 'stopped',
  ...over,
});

const state = (over: Partial<TrackingState> = {}): TrackingState => ({
  items: [],
  sessions: [],
  sessionsViewId: 'all',
  ...over,
});

const stateAtSecond = (trackedTimeInSeconds: number) => ({
  tracking: state({
    sessions: [],
    items: [
      track({
        id: 'live',
        name: 'Live',
        state: 'running',
        startTime: dayjs().hour(10).minute(0).second(0).format(),
        trackedTimeInSeconds,
      }),
    ],
  }),
});

describe('tracking.selector', () => {
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

  describe('selectLiveChartSessions and the per-second tick', () => {
    beforeEach(() => selectLiveChartSessions.release());

    it('keeps the rows it already built while the minute stands', () => {
      const first = selectLiveChartSessions(stateAtSecond(100));
      const second = selectLiveChartSessions(stateAtSecond(110));

      expect(second).toBe(first);
    });

    it('rebuilds once the live minute rolls over', () => {
      const first = selectLiveChartSessions(stateAtSecond(100));
      const next = selectLiveChartSessions(stateAtSecond(130));

      expect(next).not.toBe(first);
      expect(next[0].trackedTimeInSeconds).toBe(120);
    });
  });
});

describe('selectTrackingItemCount', () => {
  it('counts the list items', () => {
    expect(
      selectTrackingItemCount.projector({
        items: [track()],
      } as TrackingState)
    ).toBe(1);
  });

  it('falls back to 0 for an unregistered slice', () => {
    expect(selectTrackingItemCount.projector(undefined as never)).toBe(0);
  });
});
