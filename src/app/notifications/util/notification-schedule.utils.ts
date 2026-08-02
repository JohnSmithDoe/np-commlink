import dayjs, { Dayjs } from 'dayjs';

export const nextDailyOccurrence = (
  hour: number,
  minute: number,
  now: Dayjs = dayjs()
): Date => {
  const today = now.hour(hour).minute(minute).second(0).millisecond(0);
  return (today.isAfter(now) ? today : today.add(1, 'day')).toDate();
};
