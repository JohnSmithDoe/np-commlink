import { TColor, TMarker, TTimestamp } from './app.types';
import { IBaseItem } from './base-item.types';

// A notification may carry ONE deep-link command. The port stays domain-blind:
// it knows a command has a name, an entity it targets and a label to offer it
// under — and nothing about what the names mean. The producing domain owns that
// vocabulary (tracking's `TTrackingCommand`) and is the only thing that
// interprets it; the label travels WITH the command so the inbox never has to
// recognise one to render its CTA.
export type TNotificationAction = {
  type: string;
  targetId: string;
  labelKey: TMarker;
};

// Which producer published this row, and which of its own shapes the row is in.
// The inbox interprets neither string, it only compares them: `project` replaces
// exactly the rows carrying its own `owner`, and re-stamps `updatedAt` only where
// `variant` changed. A one-off `notify` carries no origin, so no projection can
// touch it.
export type TNotificationOrigin = {
  owner: string;
  variant: string;
};

export type INotification = IBaseItem & {
  body: string;
  icon: string;
  color: TColor;
  status: 'new' | 'done';
  updatedAt: TTimestamp;
  origin?: TNotificationOrigin;
  action?: TNotificationAction;
};

// What a producer hands `project`: the row's content, without the inbox's own
// bookkeeping. `createdAt` is when the inbox first saw the row and `updatedAt`
// when it last materially changed — a producer stamps `updatedAt` only to surface
// the one row the user just acted on, and otherwise leaves both to the inbox.
// This is what lets a projecting producer write the inbox without reading it.
//
// The row names its `variant` but not its owner: the reducer stamps that from the
// projection itself, so a row cannot claim an owner whose set it isn't part of.
//
// `status` is likewise the inbox's, not the producer's: dismissing a row is the
// reader's act, and a producer re-projecting its unchanged set must not undo it.
export type TProjectedNotification = Omit<
  INotification,
  'createdAt' | 'updatedAt' | 'origin' | 'status'
> & {
  variant: string;
  updatedAt?: TTimestamp;
};

export interface INotificationsState {
  items: INotification[];
  doneCollapsed: boolean;
  lastViewedAt: TTimestamp;
}

// The transient half of the notifications contract: a producer names a message,
// the inbox domain presents it (`NotificationsToastEffects`). Unlike a persisted
// `INotification` this carries an unresolved i18n key — nothing outlives the
// second and a half it is on screen, and resolving it in the one presenting
// effect keeps TranslateService out of every producer.
export interface IToastMessage {
  key: TMarker;
  params?: Record<string, string | number>;
  color?: TColor;
}
