import dayjs from 'dayjs';
import { nextDailyOccurrence } from './notification-schedule.utils';

const at = (localTime: string) => dayjs(`2026-07-20T${localTime}`);
const wallClock = (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss.SSS');

describe('nextDailyOccurrence', () => {
  it('is today when the time is still ahead, on a whole minute', () => {
    expect(wallClock(nextDailyOccurrence(9, 0, at('08:15:42.500')))).toBe(
      '2026-07-20 09:00:00.000'
    );
  });

  it('is today when the minute is still ahead within the hour', () => {
    expect(wallClock(nextDailyOccurrence(21, 30, at('21:29:00')))).toBe(
      '2026-07-20 21:30:00.000'
    );
  });

  it('rolls to tomorrow once the time has passed', () => {
    expect(wallClock(nextDailyOccurrence(9, 0, at('18:45:00')))).toBe(
      '2026-07-21 09:00:00.000'
    );
  });

  // The reminder is re-scheduled on every boot: launching the app at exactly
  // 09:00 must not fire it on the spot.
  it('rolls to tomorrow when the time is exactly now', () => {
    expect(wallClock(nextDailyOccurrence(9, 0, at('09:00:00.000')))).toBe(
      '2026-07-21 09:00:00.000'
    );
  });

  // Europe/Berlin springs forward on 2026-03-29 and falls back on 2026-10-25, so
  // those nights are 23h and 25h long. A `+24h` implementation would drift the
  // reminder to 10:00 / 08:00; a calendar day keeps it at 09:00.
  it('keeps the wall-clock time across the DST boundaries', () => {
    expect(
      wallClock(nextDailyOccurrence(9, 0, dayjs('2026-03-28T10:00:00')))
    ).toBe('2026-03-29 09:00:00.000');
    expect(
      wallClock(nextDailyOccurrence(9, 0, dayjs('2026-10-24T10:00:00')))
    ).toBe('2026-10-25 09:00:00.000');
  });

  it('reads the current clock when no `now` is given', () => {
    const next = dayjs(nextDailyOccurrence(9, 0));
    expect(next.hour()).toBe(9);
    expect(next.isAfter(dayjs())).toBe(true);
  });
});
