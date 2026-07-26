/**
 * Public model of the `tracking` bounded context (type:model).
 *
 * The tracking-owned types, split out of the `@shared/types` god-file
 * (DDD review #1). Shared-kernel types they build on (IBaseItem, TTimestamp,
 * IListState, TEditItemMode) are imported from `@shared/types`; everything
 * tracking-specific lives here and is imported by the tracking domain via
 * `../model` / `../../model`.
 */
import { TTimestamp } from '../../@shared/model/app.types';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { IListState } from '../../@shared/model/item-list.types';

// Purely an ItemDialogService handshake token — the tracking list state carries
// no `id`, and its `/data/:listId` param is a different vocabulary
// ('today'/'daily').
export const TRACKING_LIST_ID = '_tracking';

// The deep-link commands tracking publishes on a notification's `action.type`
// and is the only reader of. The shared notifications port carries the string
// opaquely — these literals are tracking's vocabulary, not the kernel's.
export type TTrackingCommand =
  'tracking.start' | 'tracking.stop' | 'tracking.pause';

export type ITrackingItem = IBaseItem & {
  startTime?: TTimestamp;
  breakTime?: TTimestamp;
  trackedTimeInSeconds?: number;
  breakInSeconds?: number;
  state: 'running' | 'stopped' | 'paused';
};

export type IDataItem = Pick<
  ITrackingItem,
  'trackedTimeInSeconds' | 'name' | 'id' | 'startTime'
>;

export type TTrackingList = IListState<ITrackingItem> & {
  title: 'Time tracking';
  sessions: ITrackingItem[];
  sessionsViewId: string;
};
export type ITrackingState = TTrackingList;
