import dayjs from 'dayjs';
import { dateForShortcut } from './date-shortcuts.utils';

const WEDNESDAY = dayjs('2026-09-16');

describe('dateForShortcut', () => {
  it('resolves the fixed offsets', () => {
    expect(dateForShortcut('today', WEDNESDAY)).toBe('2026-09-16');
    expect(dateForShortcut('tomorrow', WEDNESDAY)).toBe('2026-09-17');
  });

  it('reaches the Friday and the Sunday of the week it is already in', () => {
    expect(dateForShortcut('week', WEDNESDAY)).toBe('2026-09-18');
    expect(dateForShortcut('weekend', WEDNESDAY)).toBe('2026-09-20');
  });

  it('never offers a weekday that has passed, or today', () => {
    const friday = dayjs('2026-09-18');
    expect(dateForShortcut('week', friday)).toBe('2026-09-25');

    const saturday = dayjs('2026-09-19');
    expect(dateForShortcut('week', saturday)).toBe('2026-09-25');
    expect(dateForShortcut('weekend', saturday)).toBe('2026-09-20');

    const sunday = dayjs('2026-09-20');
    expect(dateForShortcut('weekend', sunday)).toBe('2026-09-27');
  });

  it('puts the week chip after the weekend chip on a Saturday', () => {
    const saturday = dayjs('2026-09-19');
    expect(
      dateForShortcut('week', saturday) > dateForShortcut('weekend', saturday)
    ).toBe(true);
  });

  it('stays inside the period it names, even on its last day', () => {
    expect(dateForShortcut('month', WEDNESDAY)).toBe('2026-09-30');
    expect(dateForShortcut('month', dayjs('2026-09-30'))).toBe('2026-09-30');

    expect(dateForShortcut('year', WEDNESDAY)).toBe('2026-12-31');
    expect(dateForShortcut('year', dayjs('2026-12-31'))).toBe('2026-12-31');
  });

  it('reads the month length off the month, leap year included', () => {
    expect(dateForShortcut('month', dayjs('2028-02-03'))).toBe('2028-02-29');
    expect(dateForShortcut('month', dayjs('2026-02-03'))).toBe('2026-02-28');
  });

  it('crosses the year end', () => {
    const lastDayOfYear = dayjs('2026-12-31');
    expect(dateForShortcut('tomorrow', lastDayOfYear)).toBe('2027-01-01');
    expect(dateForShortcut('week', lastDayOfYear)).toBe('2027-01-01');
  });
});
