import dayjs from 'dayjs';
import { mockTrackingItem } from '../testing/tracking.test-data';
import { adjustTrackedTime, setTrackedDuration } from './tracking-adjust.utils';

describe('tracked-time corrections', () => {
  const start = dayjs('2026-10-10T08:00:00').format();
  const item = mockTrackingItem({
    startTime: start,
    trackedTimeInSeconds: 4 * 3600,
    breakInSeconds: 600,
  });

  it('books removed time as break', () => {
    const adjusted = adjustTrackedTime(item, -45 * 60);

    expect(adjusted.trackedTimeInSeconds).toBe(4 * 3600 - 45 * 60);
    expect(adjusted.breakInSeconds).toBe(600 + 45 * 60);
    expect(adjusted.startTime).toBe(start);
  });

  it('spends the break before moving the start earlier', () => {
    const adjusted = adjustTrackedTime(item, 30 * 60);

    expect(adjusted.trackedTimeInSeconds).toBe(4 * 3600 + 30 * 60);
    expect(adjusted.breakInSeconds).toBe(0);
    expect(adjusted.startTime).toBe(dayjs('2026-10-10T07:40:00').format());
  });

  it('sets a typed duration', () => {
    const adjusted = setTrackedDuration(item, {
      hours: 3,
      minutes: 15,
      seconds: 30,
    });

    expect(adjusted.trackedTimeInSeconds).toBe(3 * 3600 + 15 * 60 + 30);
    expect(adjusted.breakInSeconds).toBe(600 + 44 * 60 + 30);
  });

  it('never drops below zero tracked time', () => {
    const adjusted = adjustTrackedTime(
      { ...item, trackedTimeInSeconds: 120 },
      -15 * 60
    );

    expect(adjusted.trackedTimeInSeconds).toBe(0);
    expect(adjusted.breakInSeconds).toBe(720);
  });

  it('leaves an item that never ran untouched', () => {
    const idle = mockTrackingItem();

    expect(adjustTrackedTime(idle, 15 * 60)).toBe(idle);
  });
});
