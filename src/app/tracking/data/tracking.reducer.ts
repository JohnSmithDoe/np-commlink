import { createReducer, on } from '@ngrx/store';
import { Timestamp } from '../../@shared/model/app.types';
import { TrackingItem, TrackingState } from '../model/tracking.types';
import { TrackingActions } from './tracking.actions';
import dayjs from 'dayjs';
import {
  addListItem,
  removeListItem,
  updateListItem,
  updateListSort,
} from '../../@shared/util/item-lists/list.utils';

export const initialState: TrackingState = {
  items: [],
  sessions: [],
  sessionsViewId: 'all',
};

const stopOtherItem = (
  listItem: TrackingItem,
  now: Timestamp
): TrackingItem => ({
  ...listItem,
  state: 'stopped',
  breakTime: listItem.state === 'running' ? now : listItem.breakTime,
});

const accruedBreakSeconds = (
  listItem: TrackingItem,
  now: Timestamp
): number => {
  const before = listItem.breakInSeconds ?? 0;
  if (!listItem.breakTime) return before;
  return before + dayjs(now).diff(dayjs(listItem.breakTime), 'seconds');
};

const resumeItem = (listItem: TrackingItem, now: Timestamp): TrackingItem => ({
  ...listItem,
  state: 'running',
  startTime: listItem.startTime ?? now,
  breakTime: undefined,
  breakInSeconds: accruedBreakSeconds(listItem, now),
  trackedTimeInSeconds: listItem.trackedTimeInSeconds ?? 0,
});

const startTracking = (
  state: TrackingState,
  item: TrackingItem,
  now: Timestamp
): TrackingState => ({
  ...state,
  items: state.items.map((listItem) =>
    listItem.id === item.id
      ? resumeItem(listItem, now)
      : stopOtherItem(listItem, now)
  ),
});
const resetTracking = (
  state: TrackingState,
  item?: TrackingItem
): TrackingState => {
  return {
    ...state,
    items: state.items.map((listItem): TrackingItem => {
      if (item && listItem.id !== item.id) {
        return listItem;
      }
      return {
        ...listItem,
        state: 'stopped',
        breakTime: undefined,
        breakInSeconds: undefined,
        startTime: undefined,
        trackedTimeInSeconds: undefined,
      };
    }),
  };
};

const pauseTracking = (
  state: TrackingState,
  item: TrackingItem,
  now: Timestamp
): TrackingState => {
  return updateListItem<TrackingState, TrackingItem>(state, {
    ...item,
    state: 'paused',
    breakTime: now,
  });
};

const updateTracking = (
  state: TrackingState,
  item: TrackingItem,
  now: Timestamp
): TrackingState => {
  const original = state.items.find((candidate) => candidate.id === item.id);
  if (!original) return state;
  const start = dayjs(original.startTime);
  if (!original.startTime || !start.isValid()) return state;
  const runningSince = dayjs(now).diff(start, 'seconds');
  const time = runningSince - (original.breakInSeconds ?? 0);

  return updateListItem<TrackingState, TrackingItem>(state, {
    ...original,
    trackedTimeInSeconds: time,
  });
};

const byStartTime = (a: TrackingItem, b: TrackingItem): number =>
  dayjs(a.startTime).diff(b.startTime);

const mergeSessions = (
  state: TrackingState,
  sessions: TrackingItem[]
): TrackingState => ({
  ...state,
  sessions: [...state.sessions, ...sessions].toSorted(byStartTime),
});

const archivedSessionId = (item: TrackingItem): string =>
  `${item.id}@${item.startTime}`;

const saveAndReset = (state: TrackingState): TrackingState => {
  const archived = state.items
    .filter((item) => !!item.startTime)
    .map((item): TrackingItem => ({
      ...item,
      state: 'stopped',
      id: archivedSessionId(item),
    }));
  return mergeSessions(resetTracking(state), archived);
};

export const trackingReducer = createReducer(
  initialState,
  on(TrackingActions.addItem, (state, { item }): TrackingState =>
    addListItem(state, item)
  ),
  on(TrackingActions.removeItem, (state, { item }): TrackingState =>
    removeListItem(state, item)
  ),
  on(TrackingActions.updateItem, (state, { item }): TrackingState =>
    updateListItem(state, item)
  ),
  on(TrackingActions.updateSearch, (state, { searchQuery }): TrackingState =>
    searchQuery === state.searchQuery ? state : { ...state, searchQuery }
  ),
  on(
    TrackingActions.toggleTrackingItem,
    (state, { item, now }): TrackingState => {
      return item.state === 'running'
        ? pauseTracking(state, item, now)
        : startTracking(state, item, now);
    }
  ),
  on(TrackingActions.resetTracking, (state, { item }): TrackingState => {
    return resetTracking(state, item);
  }),
  on(TrackingActions.resetAllTracking, (state): TrackingState => {
    return resetTracking(state);
  }),
  on(TrackingActions.saveAndResetTracking, (state): TrackingState => {
    return saveAndReset(state);
  }),
  on(TrackingActions.seedDemoSessions, (state, { sessions }): TrackingState => {
    return mergeSessions(state, sessions);
  }),
  on(TrackingActions.updateTracking, (state, { item, now }): TrackingState => {
    return updateTracking(state, item, now);
  }),

  on(TrackingActions.changeDataView, (state, { viewId }): TrackingState => {
    return { ...state, sessionsViewId: viewId };
  }),

  on(TrackingActions.removeDataItem, (state, { item }): TrackingState => {
    const deleted = new Set(item.sessionIds);
    return {
      ...state,
      sessions: state.sessions.filter((session) => !deleted.has(session.id)),
    };
  }),

  on(
    TrackingActions.updateSort,
    (state, { sortBy, sortDirection }): TrackingState => ({
      ...state,
      sort: updateListSort(sortBy, sortDirection, state.sort?.sortDirection),
    })
  ),

  on(TrackingActions.loaded, (state, { tracking }): TrackingState => {
    return {
      ...(tracking ?? state),
      items: (tracking?.items ?? state.items).map((trackingItem) => ({
        ...trackingItem,
      })),
      sessions: tracking?.sessions ?? state.sessions,
      searchQuery: undefined,
      sessionsViewId: 'today',
    };
  })
);
