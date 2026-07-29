import {
  createFeatureSelector,
  createSelector,
  createSelectorFactory,
  resultMemoize,
} from '@ngrx/store';
import {
  IDataItem,
  ITrackingItem,
  ITrackingState,
} from '../../model/tracking.types';
import dayjs from 'dayjs';
import { formatSecondsAsClock } from '../../util/tracking.utils';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/list/list.selector';
import { ISearchResult } from '../../../@shared/model/item-list.types';

export const selectTrackingState =
  createFeatureSelector<ITrackingState>('tracking');

// A started item is already a session — it is just not archived yet.
const liveSessions = (state: ITrackingState): ITrackingItem[] =>
  (state?.items ?? []).filter((item) => !!item.startTime);

// The archive is what every session-derived view is really keyed on, and it is
// untouched by the 1 Hz `updateTracking` tick — so reading it (instead of the
// whole slice) is what keeps those views off the tick.
const selectArchivedSessions = createSelector(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem[] => state?.sessions ?? []
);

const getKey = (trackingItem: ITrackingItem, listId: string) => {
  switch (listId) {
    case 'daily':
    case 'today': {
      return dayjs(trackingItem.startTime).format('YYYYMMDD');
    }
    case 'monthly': {
      return dayjs(trackingItem.startTime).format('YYYYMM');
    }
    case 'all': {
      return '';
    }
    default: {
      return dayjs(trackingItem.startTime).format('YYYYMMDDHHmm');
    }
  }
};
const bucketKeyFor = (trackingItem: ITrackingItem, listId: string): string =>
  `${getKey(trackingItem, listId)}${trackingItem.name}`;

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

const groupBy = (data: ITrackingItem[], listId: string): IDataItem[] => {
  const sessions =
    listId === 'today'
      ? data.filter((item) => dayjs(item.startTime).isSame(dayjs(), 'day'))
      : data;
  const rows: Record<string, IDataItem> = {};
  for (const session of sessions) {
    const bucketKey = bucketKeyFor(session, listId);
    rows[bucketKey] = mergedInto(rows[bucketKey], session, bucketKey);
  }

  return Object.values(rows);
};

export const selectTrackingDataViewId = createSelector(
  selectTrackingState,
  (state: ITrackingState): string => state?.sessionsViewId ?? 'today'
);
export const selectTrackingData = createSelector(
  selectArchivedSessions,
  selectTrackingDataViewId,
  (sessions, listId): IDataItem[] => groupBy(sessions, listId)
);

/**
 * Every tracked item, unfiltered — as opposed to {@link selectTrackingListItems},
 * which is the PAGE's view (its search query and category filter applied). The
 * edit dialog's duplicate-name rule needs the aggregate: a search term left in
 * the box would otherwise shrink the sibling set and let a duplicate save.
 */
export const selectTrackingItems = createSelector(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem[] => state?.items ?? []
);

export const selectTrackingListSearchResult = createSelector(
  selectTrackingState,
  (listState: ITrackingState): ISearchResult<ITrackingItem> | undefined =>
    filterListBySearchQuery(listState)
);

export const selectTrackingListItems = createSelector(
  selectTrackingState,
  selectTrackingListSearchResult,
  (state: ITrackingState, result): ITrackingItem[] =>
    filterAndSortItemList(state, result)
);
export const selectRunningTrackingItem = createSelector(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem | undefined =>
    state.items.find((item) => item.state === 'running')
);

export const selectAllTrackingSessions = createSelector(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem[] => [
    ...liveSessions(state),
    ...(state?.sessions ?? []),
  ]
);

// The chart renders whole days in hours, so a live row only needs minute
// resolution — and that is what keeps the 1 Hz `updateTracking` tick out of the
// 21-day aggregation below: the result keeps its identity until a live minute
// genuinely rolls over, so the series is rebuilt once a minute, not once a
// second (`selectAllTrackingSessions` stays at second resolution for the
// daily-sessions panel, which shows a running clock).
const toMinuteResolution = (session: ITrackingItem): ITrackingItem => ({
  ...session,
  trackedTimeInSeconds:
    Math.floor((session.trackedTimeInSeconds ?? 0) / 60) * 60,
});

const sameChartSessions = (a: ITrackingItem[], b: ITrackingItem[]): boolean =>
  a.length === b.length &&
  a.every((session, index) => {
    const other = b[index];
    return (
      other !== undefined &&
      session.id === other.id &&
      session.name === other.name &&
      session.startTime === other.startTime &&
      session.trackedTimeInSeconds === other.trackedTimeInSeconds
    );
  });

const selectLiveChartSessions = createSelectorFactory<object, ITrackingItem[]>(
  (projector) => resultMemoize(projector, sameChartSessions)
)(selectTrackingState, (state: ITrackingState): ITrackingItem[] =>
  liveSessions(state).map((session) => toMinuteResolution(session))
);

export type DailySeries = {
  days: string[];
  series: { name: string; hours: number[] }[];
};

const CHART_WINDOW_DAYS = 21;
const CHART_TOP_N = 6;
const OTHER_LABEL = 'Other';

export const selectSessionsByDayAndName = createSelector(
  selectArchivedSessions,
  selectLiveChartSessions,
  (archived, live): DailySeries => {
    const sessions = [...live, ...archived];
    const today = dayjs().startOf('day');
    const windowStart = today.subtract(CHART_WINDOW_DAYS - 1, 'day');

    const days: string[] = [];
    for (let index = 0; index < CHART_WINDOW_DAYS; index++) {
      days.push(windowStart.add(index, 'day').format('YYYY-MM-DD'));
    }

    const inWindow = sessions.filter((s) => {
      const start = dayjs(s.startTime);
      return (
        start.isValid() &&
        !start.isBefore(windowStart) &&
        !start.isAfter(today.endOf('day'))
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
    const hasOther = totalsByName.size > topNames.length;

    const seriesMap = new Map<string, number[]>();
    for (const name of topNames) {
      seriesMap.set(
        name,
        Array.from({ length: CHART_WINDOW_DAYS }, () => 0)
      );
    }
    if (hasOther) {
      seriesMap.set(
        OTHER_LABEL,
        Array.from({ length: CHART_WINDOW_DAYS }, () => 0)
      );
    }

    for (const s of inWindow) {
      const dayIndex = dayjs(s.startTime).diff(windowStart, 'day');
      if (dayIndex < 0 || dayIndex >= CHART_WINDOW_DAYS) continue;
      const bucket = topSet.has(s.name) ? s.name : OTHER_LABEL;
      const array = seriesMap.get(bucket);
      if (!array) continue;
      array[dayIndex] =
        (array[dayIndex] ?? 0) + (s.trackedTimeInSeconds ?? 0) / 3600;
    }

    return {
      days,
      series: [...seriesMap.entries()].map(([name, hours]) => ({
        name,
        hours,
      })),
    };
  }
);

export const selectTrackingTime = createSelector(
  selectTrackingState,
  (state: ITrackingState) => {
    const timeInSeconds = state.items.reduce(
      (current, previous) => current + (previous.trackedTimeInSeconds ?? 0),
      0
    );
    return formatSecondsAsClock(timeInSeconds);
  }
);

// Number of tracked activities on the deck's CHRONO tile.
export const selectTrackingItemCount = createSelector(
  selectTrackingState,
  (state) => state?.items.length ?? 0
);
