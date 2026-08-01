import { createReducer, on } from '@ngrx/store';
import { TTimestamp } from '../../@shared/model/app.types';
import { ITrackingItem, ITrackingState } from '../model/tracking.types';
import { TrackingActions } from './tracking.actions';
import dayjs from 'dayjs';
import {
  addListItem,
  removeListItem,
  updateListItem,
  updateListSort,
} from '../../@shared/util/item-lists/list.utils';

export const initialState: ITrackingState = {
  items: [],
  sessions: [],
  sessionsViewId: 'all',
};

// Only one item tracks at a time, so starting one stops every other. A stopped
// item keeps the moment it stopped as `breakTime`, which is what lets a later
// resume fold the pause into `breakInSeconds`.
const stopOtherItem = (
  listItem: ITrackingItem,
  now: TTimestamp
): ITrackingItem => ({
  ...listItem,
  state: 'stopped',
  breakTime: listItem.state === 'running' ? now : listItem.breakTime,
});

const accruedBreakSeconds = (
  listItem: ITrackingItem,
  now: TTimestamp
): number => {
  const before = listItem.breakInSeconds ?? 0;
  if (!listItem.breakTime) return before;
  return before + dayjs(now).diff(dayjs(listItem.breakTime), 'seconds');
};

const resumeItem = (
  listItem: ITrackingItem,
  now: TTimestamp
): ITrackingItem => ({
  ...listItem,
  state: 'running',
  startTime: listItem.startTime ?? now,
  breakTime: undefined,
  breakInSeconds: accruedBreakSeconds(listItem, now),
  trackedTimeInSeconds: listItem.trackedTimeInSeconds ?? 0,
});

const startTracking = (
  state: ITrackingState,
  item: ITrackingItem,
  now: TTimestamp
): ITrackingState => ({
  ...state,
  items: state.items.map((listItem) =>
    listItem.id === item.id
      ? resumeItem(listItem, now)
      : stopOtherItem(listItem, now)
  ),
});
const resetTracking = (
  state: ITrackingState,
  item?: ITrackingItem
): ITrackingState => {
  return {
    ...state,
    items: state.items.map((listItem): ITrackingItem => {
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
  state: ITrackingState,
  item: ITrackingItem,
  now: TTimestamp
): ITrackingState => {
  return updateListItem<ITrackingState, ITrackingItem>(state, {
    ...item,
    state: 'paused',
    breakTime: now,
  });
};

const updateTracking = (
  state: ITrackingState,
  item: ITrackingItem,
  now: TTimestamp
): ITrackingState => {
  const original = state.items.find((candidate) => candidate.id === item.id);
  if (!original) return state;
  const start = dayjs(original.startTime);
  if (!original.startTime || !start.isValid()) return state;
  const runningSince = dayjs(now).diff(start, 'seconds');
  const time = runningSince - (original.breakInSeconds ?? 0);

  return updateListItem<ITrackingState, ITrackingItem>(state, {
    ...original,
    trackedTimeInSeconds: time,
  });
};

const byStartTime = (a: ITrackingItem, b: ITrackingItem): number =>
  dayjs(a.startTime).diff(b.startTime);

const mergeSessions = (
  state: ITrackingState,
  sessions: ITrackingItem[]
): ITrackingState => ({
  ...state,
  sessions: [...state.sessions, ...sessions].toSorted(byStartTime),
});

// An archived session is "this activity, from that start moment", so its id is
// derived from exactly that instead of minted: the arm stays a pure function of
// (state, action), like every other one that takes its `now` from the payload.
const archivedSessionId = (item: ITrackingItem): string =>
  `${item.id}@${item.startTime}`;

const saveAndReset = (state: ITrackingState): ITrackingState => {
  const archived = state.items
    .filter((item) => !!item.startTime)
    .map((item): ITrackingItem => ({
      ...item,
      state: 'stopped',
      id: archivedSessionId(item),
    }));
  return mergeSessions(resetTracking(state), archived);
};

export const trackingReducer = createReducer(
  initialState,
  on(TrackingActions.addItem, (state, { item }): ITrackingState =>
    addListItem(state, item)
  ),
  on(TrackingActions.removeItem, (state, { item }): ITrackingState =>
    removeListItem(state, item)
  ),
  on(TrackingActions.updateItem, (state, { item }): ITrackingState =>
    updateListItem(state, item)
  ),
  on(TrackingActions.updateSearch, (state, { searchQuery }): ITrackingState =>
    searchQuery === state.searchQuery ? state : { ...state, searchQuery }
  ),
  on(
    TrackingActions.toggleTrackingItem,
    (state, { item, now }): ITrackingState => {
      return item.state === 'running'
        ? pauseTracking(state, item, now)
        : startTracking(state, item, now);
    }
  ),
  on(TrackingActions.resetTracking, (state, { item }): ITrackingState => {
    return resetTracking(state, item);
  }),
  on(TrackingActions.resetAllTracking, (state): ITrackingState => {
    return resetTracking(state);
  }),
  on(TrackingActions.saveAndResetTracking, (state): ITrackingState => {
    return saveAndReset(state);
  }),
  on(
    TrackingActions.seedDemoSessions,
    (state, { sessions }): ITrackingState => {
      return mergeSessions(state, sessions);
    }
  ),
  on(TrackingActions.updateTracking, (state, { item, now }): ITrackingState => {
    return updateTracking(state, item, now);
  }),

  on(TrackingActions.changeDataView, (state, { viewId }): ITrackingState => {
    return { ...state, sessionsViewId: viewId };
  }),

  // A stats row is a bucket of merged sessions, so it deletes the ones it lists.
  on(TrackingActions.removeDataItem, (state, { item }): ITrackingState => {
    const deleted = new Set(item.sessionIds);
    return {
      ...state,
      sessions: state.sessions.filter((session) => !deleted.has(session.id)),
    };
  }),

  on(
    TrackingActions.updateSort,
    (state, { sortBy, sortDirection }): ITrackingState => ({
      ...state,
      sort: updateListSort(sortBy, sortDirection, state.sort?.sortDirection),
    })
  ),

  on(TrackingActions.loaded, (state, { tracking }): ITrackingState => {
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
