/**
 * Public model of the `tracking` bounded context (type:model).
 *
 * The tracking-owned types, split out of the `@shared/types` god-file
 * (DDD review #1). Shared-kernel types they build on (IBaseItem, TTimestamp,
 * IListState, TEditItemMode) are imported from `@shared/types`; everything
 * tracking-specific lives here and is imported by the tracking domain via
 * `../model` / `../../model`.
 */
import { IBaseItem, IListState, TTimestamp } from '../../@shared/model/types';

export type ITrackingItemNotificationsConfig = {
  onStart: boolean;
  onStop: boolean;
  onProcess: boolean;
};

export type ITrackingItem = IBaseItem & {
  startTime?: TTimestamp;
  breakTime?: TTimestamp;
  trackedTimeInSeconds?: number;
  breakInSeconds?: number;
  state: 'running' | 'stopped' | 'paused';
  notifications?: ITrackingItemNotificationsConfig;
};

export type IDataItem = Pick<
  ITrackingItem,
  'trackedTimeInSeconds' | 'name' | 'id' | 'startTime'
>;

export type TTrackingList = IListState<ITrackingItem> & {
  title: 'Time tracking';
  data: ITrackingItem[];
  dataViewId: string;
};
export type ITrackingState = TTrackingList;
