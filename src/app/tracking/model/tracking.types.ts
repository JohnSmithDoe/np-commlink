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

// The deep-link commands tracking publishes on a notification's `action.type`.
// Tracking is the only reader: the shared port carries the string opaquely and
// the CTA's label rides along on the same action, so adding a command is a change
// in this domain alone.
export type TTrackingCommand = 'tracking.start' | 'tracking.pause';

export type ITrackingItem = IBaseItem & {
  startTime?: TTimestamp;
  breakTime?: TTimestamp;
  trackedTimeInSeconds?: number;
  breakInSeconds?: number;
  state: 'running' | 'stopped' | 'paused';
};

/**
 * One row of the stats page: several sessions of the same activity, merged into
 * the bucket the selected view groups by (a day, a month, all time).
 *
 * `id` is the bucket's own key, not a session's — a row deletes the sessions it
 * lists in `sessionIds`, so merging can never make "delete this row" mean
 * "delete one of the sessions behind it".
 */
export type IDataItem = Pick<
  ITrackingItem,
  'trackedTimeInSeconds' | 'name' | 'id' | 'startTime'
> & {
  sessionIds: string[];
};

export type TTrackingList = IListState<ITrackingItem> & {
  sessions: ITrackingItem[];
  sessionsViewId: string;
};
export type ITrackingState = TTrackingList;
