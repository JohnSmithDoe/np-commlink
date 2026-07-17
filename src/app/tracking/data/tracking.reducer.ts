import { createReducer, on } from '@ngrx/store';
import { ITrackingItem, ITrackingState, TTimestamp } from '../../@shared/types';
import { TrackingActions } from './tracking.actions';
import dayjs from 'dayjs';
import {
  addListItem,
  removeListItem,
  updateListItem,
  updateListSort,
} from '../../@shared/util/item-list/item-list.utils';
import { uuidv4 } from '../../@shared/util/app.utils';

export const initialState: ITrackingState = {
  title: 'Time tracking',
  items: [],
  // categories/mode are required by the shared IItemList base (grocery lists
  // use them); the tracking list keeps an empty set and the default mode.
  categories: [],
  mode: 'alphabetical',
  data: [],
  dataViewId: 'all',
};

const startTracking = (
  state: ITrackingState,
  item: ITrackingItem,
  now: TTimestamp
): ITrackingState => {
  return {
    ...state,
    items: state.items.map((listItem) => {
      if (listItem.id !== item.id) {
        return {
          ...listItem,
          state: 'stopped',
          breakTime: listItem.state === 'running' ? now : listItem.breakTime,
        };
      }
      let breakInSeconds = listItem.breakInSeconds ?? 0;
      if (listItem.breakTime) {
        breakInSeconds += dayjs(now).diff(dayjs(listItem.breakTime), 'seconds');
      }

      return {
        ...listItem,
        state: 'running',
        startTime: listItem.startTime ?? now,
        breakTime: undefined,
        breakInSeconds,
        trackedTimeInSeconds: listItem.trackedTimeInSeconds ?? 0,
      };
    }),
  };
};
const resetTracking = (
  state: ITrackingState,
  item?: ITrackingItem
): ITrackingState => {
  return {
    ...state,
    items: state.items.map((listItem): ITrackingItem => {
      if (item && listItem.id !== item.id) {
        return { ...listItem };
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

const stopTracking = (
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
  const original = state.items.find((aItem) => aItem.id === item.id);
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

const DUMMY_NAMES = [
  'Code review',
  'Standup',
  'Feature work',
  'Bug fixing',
  'Documentation',
  'Pair programming',
  'Email & Slack',
  'Deep work',
];

const generateDummyData = (state: ITrackingState): ITrackingState => {
  const generated: ITrackingItem[] = [];
  for (let dayOffset = 0; dayOffset < 21; dayOffset++) {
    const day = dayjs().subtract(dayOffset, 'day');
    const sessionsToday = 2 + Math.floor(Math.random() * 3);
    let hour = 8 + Math.floor(Math.random() * 2);
    for (let i = 0; i < sessionsToday; i++) {
      const startMinute = Math.floor(Math.random() * 50);
      const start = day.hour(hour).minute(startMinute).second(0);
      const durationMinutes = 15 + Math.floor(Math.random() * 165);
      generated.push({
        id: uuidv4(),
        name: DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)],
        createdAt: start.format(),
        startTime: start.format(),
        trackedTimeInSeconds: durationMinutes * 60,
        state: 'stopped',
      });
      hour += 1 + Math.floor(durationMinutes / 60);
      if (hour > 19) break;
    }
  }
  return {
    ...state,
    data: [...state.data, ...generated].sort((a, b) =>
      dayjs(a.startTime).diff(b.startTime)
    ),
  };
};

const saveAndReset = (state: ITrackingState): ITrackingState => {
  const data: ITrackingItem[] = [
    ...state.data,
    ...state.items
      .filter((item) => !!item.startTime)
      .map(
        (item): ITrackingItem => ({ ...item, state: 'stopped', id: uuidv4() }) // save with new id
      ),
  ].sort((a, b) => dayjs(a.startTime).diff(b.startTime));
  return {
    ...resetTracking(state),
    data,
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
      if (item.state !== 'running') {
        return startTracking(state, item, now);
      } else {
        return stopTracking(state, item, now);
      }
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
  on(TrackingActions.generateDummyData, (state): ITrackingState => {
    return generateDummyData(state);
  }),
  on(TrackingActions.updateTracking, (state, { item, now }): ITrackingState => {
    return updateTracking(state, item, now);
  }),

  on(TrackingActions.changeDataView, (state, { viewId }): ITrackingState => {
    return { ...state, dataViewId: viewId };
  }),

  on(TrackingActions.removeDataItem, (state, { item }): ITrackingState => {
    return {
      ...state,
      data: state.data.filter((aitem) => aitem.id !== item.id),
    };
  }),

  on(
    TrackingActions.updateSort,
    (state, { sortBy, sortDir }): ITrackingState => ({
      ...state,
      sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),
    })
  ),

  on(TrackingActions.loaded, (_state, { tracking }): ITrackingState => {
    return {
      ...(tracking ?? _state),
      items: (tracking?.items ?? _state.items).map((trackingItem) => ({
        ...trackingItem,
      })),
      searchQuery: undefined,
      dataViewId: 'today',
    };
  })
);
