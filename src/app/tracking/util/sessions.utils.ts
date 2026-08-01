import dayjs from 'dayjs';
import {
  DailySeries,
  IDataItem,
  ITrackingItem,
  TTrackingViewId,
} from '../model/tracking.types';

/**
 * The two session views that depend on what day it is — as pure functions taking
 * the day, rather than selectors reading the clock.
 *
 * They lived in `tracking/data/selectors` and called `dayjs()` inside their
 * projectors, which a `createSelector` cannot see: memoization is on the declared
 * inputs, so both froze at whatever "today" meant when they last recomputed. Here
 * the day is an argument, `data/` keeps no pure logic, and neither spec needs a
 * frozen clock to say what it means.
 */

// The sortable stamp each view buckets sessions by. Machine-readable on purpose
// — it is a grouping key, never displayed, so it stays locale-independent while
// the row's caption goes through `formatViewDate`. `'all'` merges every date.
const BUCKET_STAMPS: Record<TTrackingViewId, string> = {
  raw: 'YYYYMMDDHHmm',
  today: 'YYYYMMDD',
  daily: 'YYYYMMDD',
  monthly: 'YYYYMM',
  all: '',
};

const bucketKeyFor = (
  trackingItem: ITrackingItem,
  viewId: TTrackingViewId
): string => {
  const stamp = BUCKET_STAMPS[viewId];
  const bucket = stamp ? dayjs(trackingItem.startTime).format(stamp) : '';
  return `${bucket}${trackingItem.name}`;
};

const mergedInto = (
  row: IDataItem | undefined,
  session: ITrackingItem,
  bucketKey: string
): IDataItem => ({
  ...session,
  id: bucketKey,
  trackedTimeInSeconds:
    (row?.trackedTimeInSeconds ?? 0) + (session.trackedTimeInSeconds ?? 0),
  sessionIds: [...(row?.sessionIds ?? []), session.id],
});

/** Merge sessions into the buckets `viewId` groups by; `'today'` keeps only `today`'s. */
export const groupSessionsByView = (
  data: ITrackingItem[],
  viewId: TTrackingViewId,
  today: string
): IDataItem[] => {
  const sessions =
    viewId === 'today'
      ? data.filter((item) => dayjs(item.startTime).isSame(today, 'day'))
      : data;
  const rows: Record<string, IDataItem> = {};
  for (const session of sessions) {
    const bucketKey = bucketKeyFor(session, viewId);
    rows[bucketKey] = mergedInto(rows[bucketKey], session, bucketKey);
  }

  return Object.values(rows);
};

const CHART_WINDOW_DAYS = 21;
const CHART_TOP_N = 6;

/** The stacked-bar source: hours per day per activity over the window ending `today`. */
export const dailySeries = (
  archived: ITrackingItem[],
  live: ITrackingItem[],
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
  // Held beside the map rather than in it, keyed by nothing: a name is the only
  // key a Map of activities has, and the remainder is not an activity.
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
