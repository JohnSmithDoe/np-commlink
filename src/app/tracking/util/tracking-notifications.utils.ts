import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { TColor } from '../../@shared/model/app.types';
import { ITrackingItem, TTrackingCommand } from '../model/tracking.types';

marker('notifications.tracking.running.title');
marker('notifications.tracking.running.body');
marker('notifications.tracking.paused.title');
marker('notifications.tracking.paused.body');
marker('notifications.tracking.stopped.title');
marker('notifications.tracking.stopped.body');

const TRACKING_STATE_PREFIX = 'tracking-page-state:';

// The set of inbox rows tracking claims. It projects this whole set on every
// mutation, so the inbox — not tracking — is what drops the rows that fall out of
// it, and rows other producers own are none of tracking's business.
export const TRACKING_NOTIFICATIONS_OWNER = 'tracking';

export const trackingStateNotificationId = (itemId: string) =>
  `${TRACKING_STATE_PREFIX}${itemId}`;

export type TrackingNotificationKind = 'running' | 'paused' | 'stopped';

export type TrackingNotificationPreset = {
  icon: string;
  color: TColor;
  titleKey: string;
  bodyKey: string;
  action?: TTrackingCommand;
};

export const TRACKING_NOTIFICATION_PRESETS: Record<
  TrackingNotificationKind,
  TrackingNotificationPreset
> = {
  running: {
    icon: 'play-circle',
    color: 'success',
    titleKey: 'notifications.tracking.running.title',
    bodyKey: 'notifications.tracking.running.body',
    action: 'tracking.pause',
  },
  paused: {
    icon: 'pause-circle',
    color: 'warning',
    titleKey: 'notifications.tracking.paused.title',
    bodyKey: 'notifications.tracking.paused.body',
    action: 'tracking.start',
  },
  stopped: {
    icon: 'stop-circle',
    color: 'medium',
    titleKey: 'notifications.tracking.stopped.title',
    bodyKey: 'notifications.tracking.stopped.body',
  },
};

export const kindForState = (
  state: ITrackingItem['state']
): TrackingNotificationKind =>
  state === 'running' ? 'running' : state === 'paused' ? 'paused' : 'stopped';

export const runningDurationMinutes = (
  item: ITrackingItem,
  now = dayjs()
): number => {
  if (!item.startTime) return 0;
  const tracked =
    now.diff(dayjs(item.startTime), 'seconds') - (item.breakInSeconds ?? 0);
  return Math.max(0, Math.floor(tracked / 60));
};

// An item earns an inbox row once it has been started, and keeps it while it
// still carries that startTime — so a stop is still reported, and a reset (which
// wipes the item's tracking) drops the row with it.
export const needsStateNotification = (item: ITrackingItem): boolean =>
  !!item.startTime;

// toggleTrackingItem branches on item.state ('running' -> stop, else start), so
// the CTA must hand it the opposite state to force the branch the user asked for.
// `cta` arrives as the port's opaque string; anything unrecognised falls through
// to 'running', i.e. "stop it", which is the safe reading of a stale command.
export const stateHintForCta = (cta: string): ITrackingItem['state'] =>
  cta === ('tracking.start' satisfies TTrackingCommand) ? 'stopped' : 'running';
