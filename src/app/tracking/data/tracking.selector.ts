import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ISearchResult } from '../../@shared/types';
import { IDataItem, ITrackingItem, ITrackingState } from '../model';
import dayjs from 'dayjs';
import { formatSecondsAsClock } from './tracking.utils';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/list/list.selector';

export const selectTrackingState =
  createFeatureSelector<ITrackingState>('tracking');

const getKey = (trackingItem: ITrackingItem, listId: string) => {
  if (listId === 'daily' || listId === 'today') {
    return dayjs(trackingItem.startTime).format('YYYYMMDD');
  } else if (listId === 'monthly') {
    return dayjs(trackingItem.startTime).format('YYYYMM');
  } else if (listId === 'all') {
    return '';
  } else {
    return dayjs(trackingItem.startTime).format('YYYYMMDDHHmm');
  }
};
const groupBy = (data: ITrackingItem[], listId: string) => {
  const items =
    listId === 'today'
      ? data.filter((item) => dayjs(item.startTime).isSame(dayjs(), 'day'))
      : data;
  const map: Record<string, IDataItem> = {};
  items.forEach((trackingItem) => {
    let key = getKey(trackingItem, listId);
    key += trackingItem.name;
    const current = map[key]?.trackedTimeInSeconds ?? 0;
    map[key] = {
      ...trackingItem,
      trackedTimeInSeconds: current + (trackingItem.trackedTimeInSeconds ?? 0),
    };
  });

  return Object.values(map);
};

export const selectTrackingDataViewId = createSelector(
  selectTrackingState,
  (state: ITrackingState) => {
    let listId = state?.dataViewId;
    return listId ?? 'today';
  }
);
export const selectTrackingData = createSelector(
  selectTrackingState,
  selectTrackingDataViewId,
  (state: ITrackingState, listId): IDataItem[] => {
    let data = state?.data ?? [];
    return groupBy(data, listId);
  }
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
  (state: ITrackingState): ITrackingItem[] => {
    const live = (state?.items ?? []).filter((item) => !!item.startTime);
    const archived = state?.data ?? [];
    return [...live, ...archived];
  }
);

export type DailySeries = {
  days: string[];
  series: { name: string; hours: number[] }[];
};

const CHART_WINDOW_DAYS = 21;
const CHART_TOP_N = 6;
const OTHER_LABEL = 'Other';

export const selectSessionsByDayAndName = createSelector(
  selectAllTrackingSessions,
  (sessions): DailySeries => {
    const today = dayjs().startOf('day');
    const windowStart = today.subtract(CHART_WINDOW_DAYS - 1, 'day');

    const days: string[] = [];
    for (let i = 0; i < CHART_WINDOW_DAYS; i++) {
      days.push(windowStart.add(i, 'day').format('YYYY-MM-DD'));
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, CHART_TOP_N)
      .map(([name]) => name);
    const topSet = new Set(topNames);
    const hasOther = totalsByName.size > topNames.length;

    const seriesMap = new Map<string, number[]>();
    for (const name of topNames) {
      seriesMap.set(name, new Array(CHART_WINDOW_DAYS).fill(0));
    }
    if (hasOther) {
      seriesMap.set(OTHER_LABEL, new Array(CHART_WINDOW_DAYS).fill(0));
    }

    for (const s of inWindow) {
      const dayIdx = dayjs(s.startTime).diff(windowStart, 'day');
      if (dayIdx < 0 || dayIdx >= CHART_WINDOW_DAYS) continue;
      const bucket = topSet.has(s.name) ? s.name : OTHER_LABEL;
      const arr = seriesMap.get(bucket);
      if (!arr) continue;
      arr[dayIdx] += (s.trackedTimeInSeconds ?? 0) / 3600;
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
      (cur, prev) => cur + (prev.trackedTimeInSeconds ?? 0),
      0
    );
    return formatSecondsAsClock(timeInSeconds);
  }
);
