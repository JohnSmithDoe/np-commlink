import dayjs, { Dayjs } from 'dayjs';

/**
 * A repeating reminder is re-scheduled on every app boot, so a time that has
 * already passed today — or is exactly now — has to roll to tomorrow, otherwise
 * the reminder fires the moment the app opens.
 *
 * `add(1, 'day')` is calendar arithmetic, not `+24h`: the reminder keeps its
 * wall-clock time across a DST shift.
 */
export const nextDailyOccurrence = (
  hour: number,
  minute: number,
  now: Dayjs = dayjs()
): Date => {
  const today = now.hour(hour).minute(minute).second(0).millisecond(0);
  return (today.isAfter(now) ? today : today.add(1, 'day')).toDate();
};
