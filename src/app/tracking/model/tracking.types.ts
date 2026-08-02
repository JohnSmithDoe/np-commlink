import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker, Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { ListState } from '../../@shared/model/item-list.types';

export const TRACKING_LIST_ID = '_tracking';

export type TrackingCommand = 'tracking.start' | 'tracking.pause';

export type TrackingItem = BaseItem & {
  startTime?: Timestamp;
  breakTime?: Timestamp;
  trackedTimeInSeconds?: number;
  breakInSeconds?: number;
  state: TrackingItemState;
};

export type DataItem = Pick<
  TrackingItem,
  'trackedTimeInSeconds' | 'name' | 'id' | 'startTime'
> & {
  sessionIds: string[];
};

export type DailySeries = {
  days: string[];
  series: { name?: string; hours: number[] }[];
};

type TrackingItemState = 'running' | 'stopped' | 'paused';

export const TRACKING_STATE_LABEL_KEYS: Record<TrackingItemState, Marker> = {
  running: marker('tracking.item.state.running'),
  stopped: marker('tracking.item.state.stopped'),
  paused: marker('tracking.item.state.paused'),
};

export type TrackingViewId = 'raw' | 'today' | 'daily' | 'monthly' | 'all';

export const TRACKING_VIEW_IDS = [
  'raw',
  'today',
  'daily',
  'monthly',
  'all',
] as const satisfies readonly TrackingViewId[];

type TrackingList = ListState<TrackingItem> & {
  sessions: TrackingItem[];
  sessionsViewId: TrackingViewId;
};
export type TrackingState = TrackingList;
