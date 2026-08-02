import dayjs from 'dayjs';
import {
  DailySeries,
  DataItem,
  TrackingItem,
  TrackingViewId,
} from '../model/tracking.types';

const BUCKET_STAMPS: Record<TrackingViewId, string> = {
  raw: 'YYYYMMDDHHmm',
  today: 'YYYYMMDD',
  daily: 'YYYYMMDD',
  monthly: 'YYYYMM',
  all: '',
};

const bucketKeyFor = (
  trackingItem: TrackingItem,
  viewId: TrackingViewId
): string => {
  const stamp = BUCKET_STAMPS[viewId];
  const bucket = stamp ? dayjs(trackingItem.startTime).format(stamp) : '';
  return `${bucket}${trackingItem.name}`;
};

const mergedInto = (
  row: DataItem | undefined,
  session: TrackingItem,
  bucketKey: string
): DataItem => ({
  ...session,
  id: bucketKey,
  trackedTimeInSeconds:
    (row?.trackedTimeInSeconds ?? 0) + (session.trackedTimeInSeconds ?? 0),
  sessionIds: [...(row?.sessionIds ?? []), session.id],
});

export const groupSessionsByView = (
  data: TrackingItem[],
  viewId: TrackingViewId,
  today: string
): DataItem[] => {
  const sessions =
    viewId === 'today'
      ? data.filter((item) => dayjs(item.startTime).isSame(today, 'day'))
      : data;
  const rows: Record<string, DataItem> = {};
  for (const session of sessions) {
    const bucketKey = bucketKeyFor(session, viewId);
    rows[bucketKey] = mergedInto(rows[bucketKey], session, bucketKey);
  }

  return Object.values(rows);
};

const CHART_WINDOW_DAYS = 21;
const CHART_TOP_N = 6;

export const dailySeries = (
  archived: TrackingItem[],
  live: TrackingItem[],
  today: string
): DailySeries => {
  const sessions = [...live, ...archived];
  const lastDay = dayjs(today).startOf('day');
  const windowStart = lastDay.subtract(CHART_WINDOW_DAYS - 1, 'day');

  const days: string[] = [];
  for (let index = 0; index < CHART_WINDOW_DAYS; index++) {
    days.push(windowStart.add(index, 'day').format('YYYY-MM-DD'));
  }

  const inWindow = sessions.filter((s) => {
    const start = dayjs(s.startTime);
    return (
      start.isValid() &&
      !start.isBefore(windowStart) &&
      !start.isAfter(lastDay.endOf('day'))
    );
  });

  const totalsByName = new Map<string, number>();
  for (const s of inWindow) {
    totalsByName.set(
      s.name,
      (totalsByName.get(s.name) ?? 0) + (s.trackedTimeInSeconds ?? 0)
    );
  }
  const topNames = [...totalsByName.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, CHART_TOP_N)
    .map(([name]) => name);
  const topSet = new Set(topNames);
  const emptyWindow = (): number[] =>
    Array.from({ length: CHART_WINDOW_DAYS }, () => 0);

  const seriesMap = new Map<string, number[]>();
  for (const name of topNames) seriesMap.set(name, emptyWindow());
  const otherHours =
    totalsByName.size > topNames.length ? emptyWindow() : undefined;

  for (const s of inWindow) {
    const dayIndex = dayjs(s.startTime).diff(windowStart, 'day');
    if (dayIndex < 0 || dayIndex >= CHART_WINDOW_DAYS) continue;
    const array = topSet.has(s.name) ? seriesMap.get(s.name) : otherHours;
    if (!array) continue;
    array[dayIndex] =
      (array[dayIndex] ?? 0) + (s.trackedTimeInSeconds ?? 0) / 3600;
  }

  return {
    days,
    series: [
      ...[...seriesMap.entries()].map(([name, hours]) => ({ name, hours })),
      ...(otherHours ? [{ hours: otherHours }] : []),
    ],
  };
};
