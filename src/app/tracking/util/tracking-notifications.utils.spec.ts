import dayjs from 'dayjs';
import { mockTrackingItem } from '../testing/tracking.test-data';
import {
  kindForState,
  runningDurationMinutes,
} from './tracking-notifications.utils';

describe('tracking-notifications.utils', () => {
  describe('kindForState', () => {
    it('maps the tracking state to a notification kind', () => {
      expect(kindForState('running')).toBe('running');
      expect(kindForState('paused')).toBe('paused');
      expect(kindForState('stopped')).toBe('stopped');
    });
  });

  describe('runningDurationMinutes', () => {
    const now = dayjs('2026-07-20T10:30:00.000Z');

    it('returns 0 without a startTime', () => {
      expect(runningDurationMinutes(mockTrackingItem(), now)).toBe(0);
    });

    it('floors the elapsed minutes since startTime', () => {
      const item = mockTrackingItem({
        state: 'running',
        startTime: '2026-07-20T10:00:00.000Z',
      });
      expect(runningDurationMinutes(item, now)).toBe(30);
    });

    it('subtracts the accumulated break time', () => {
      const item = mockTrackingItem({
        state: 'running',
        startTime: '2026-07-20T10:00:00.000Z',
        breakInSeconds: 600,
      });
      expect(runningDurationMinutes(item, now)).toBe(20);
    });

    it('clamps to 0 when the break exceeds the elapsed span', () => {
      const item = mockTrackingItem({
        state: 'running',
        startTime: '2026-07-20T10:00:00.000Z',
        breakInSeconds: 999_999,
      });
      expect(runningDurationMinutes(item, now)).toBe(0);
    });
  });
});
