import { createReducer, on } from '@ngrx/store';
import { TTimestamp } from '../../../@shared/model/app.types';
import { ITrackingItem, ITrackingState } from '../../model/tracking.types';
import { TrackingActions } from '../actions/tracking.actions';
import dayjs from 'dayjs';
import {
  addListItem,
  removeListItem,
  updateListItem,
  updateListSort,
} from '../../../@shared/util/list/list.utils';
import { uuidv4 } from '../../../@shared/util/app.utils';

export const initialState: ITrackingState = {
  title: 'Time tracking',
  items: [],
  // categories/mode are required by the shared IItemList base (grocery lists
  // use them); the tracking list keeps an empty set and the default mode.
  categories: [],
  mode: 'alphabetical',
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

const DEMO_NAMES = [
  'Code review',
  'Standup',
  'Feature work',
  'Bug fixing',
  'Documentation',
  'Pair programming',
  'Email & Slack',
  'Deep work',
];

const DEMO_DAYS = 21;
const DEMO_SESSIONS_PER_DAY_MIN = 2;
const DEMO_SESSIONS_PER_DAY_SPREAD = 3;
const DEMO_FIRST_HOUR = 8;
const DEMO_FIRST_HOUR_SPREAD = 2;
const DEMO_LAST_HOUR = 19;
const DEMO_MINUTES_MIN = 15;
const DEMO_MINUTES_SPREAD = 165;

const upTo = (spread: number): number => Math.floor(Math.random() * spread);

const byStartTime = (a: ITrackingItem, b: ITrackingItem): number =>
  dayjs(a.startTime).diff(b.startTime);

const randomSession = (start: dayjs.Dayjs, minutes: number): ITrackingItem => ({
  id: uuidv4(),
  name: DEMO_NAMES[upTo(DEMO_NAMES.length)],
  createdAt: start.format(),
  startTime: start.format(),
  trackedTimeInSeconds: minutes * 60,
  state: 'stopped',
});

// Walks the working day forward so the generated sessions never overlap, and
// stops once it would run past the evening.
const randomSessionsForDay = (day: dayjs.Dayjs): ITrackingItem[] => {
  const sessions: ITrackingItem[] = [];
  const count = DEMO_SESSIONS_PER_DAY_MIN + upTo(DEMO_SESSIONS_PER_DAY_SPREAD);
  let hour = DEMO_FIRST_HOUR + upTo(DEMO_FIRST_HOUR_SPREAD);
  for (let index = 0; index < count; index++) {
    const start = day.hour(hour).minute(upTo(50)).second(0);
    const minutes = DEMO_MINUTES_MIN + upTo(DEMO_MINUTES_SPREAD);
    sessions.push(randomSession(start, minutes));
    hour += 1 + Math.floor(minutes / 60);
    if (hour > DEMO_LAST_HOUR) break;
  }
  return sessions;
};

// `sessions` was persisted under the key `data` before it was renamed. Storage
// is never migrated in this app, so the load path has to read the old key too.
const legacySessions = (stored: unknown): ITrackingItem[] | undefined =>
  (stored as { data?: ITrackingItem[] } | null | undefined)?.data;

const seedDemoSessions = (state: ITrackingState): ITrackingState => {
  const generated: ITrackingItem[] = [];
  for (let dayOffset = 0; dayOffset < DEMO_DAYS; dayOffset++) {
    generated.push(...randomSessionsForDay(dayjs().subtract(dayOffset, 'day')));
  }
  return {
    ...state,
    sessions: [...state.sessions, ...generated].toSorted(byStartTime),
  };
};

const saveAndReset = (state: ITrackingState): ITrackingState => {
  const sessions: ITrackingItem[] = [
    ...state.sessions,
    ...state.items
      .filter((item) => !!item.startTime)
      .map((item): ITrackingItem => ({
        ...item,
        state: 'stopped',
        id: uuidv4(),
      })),
  ].toSorted(byStartTime);
  return {
    ...resetTracking(state),
    sessions,
  };
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
  on(TrackingActions.seedDemoSessions, (state): ITrackingState => {
    return seedDemoSessions(state);
  }),
  on(TrackingActions.updateTracking, (state, { item, now }): ITrackingState => {
    return updateTracking(state, item, now);
  }),

  on(TrackingActions.changeDataView, (state, { viewId }): ITrackingState => {
    return { ...state, sessionsViewId: viewId };
  }),

  on(TrackingActions.removeDataItem, (state, { item }): ITrackingState => {
    return {
      ...state,
      sessions: state.sessions.filter((session) => session.id !== item.id),
    };
  }),

  on(
    TrackingActions.updateSort,
    (state, { sortBy, sortDir }): ITrackingState => ({
      ...state,
      sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),
    })
  ),

  on(TrackingActions.loaded, (state, { tracking }): ITrackingState => {
    return {
      ...(tracking ?? state),
      items: (tracking?.items ?? state.items).map((trackingItem) => ({
        ...trackingItem,
      })),
      // `sessions` was persisted as `data` before the rename, and this arm
      // spreads the stored doc raw — without the fallback an existing install's
      // archived sessions would silently disappear.
      sessions:
        tracking?.sessions ?? legacySessions(tracking) ?? state.sessions,
      searchQuery: undefined,
      sessionsViewId: 'today',
    };
  })
);
