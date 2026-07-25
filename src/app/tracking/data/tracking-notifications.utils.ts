import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { TColor, TNotificationAction } from '../../@shared/model/types';
import { ITrackingItem } from '../model';

marker('notifications.tracking.running.title');
marker('notifications.tracking.running.body');
marker('notifications.tracking.paused.title');
marker('notifications.tracking.paused.body');
marker('notifications.tracking.stopped.title');
marker('notifications.tracking.stopped.body');

const TRACKING_STATE_PREFIX = 'tracking-page-state:';

export const trackingStateNotificationId = (itemId: string) =>
  `${TRACKING_STATE_PREFIX}${itemId}`;

export const isTrackingStateNotificationId = (id: string): boolean =>
  id.startsWith(TRACKING_STATE_PREFIX);

export const trackingItemIdFromNotificationId = (id: string): string =>
  id.slice(TRACKING_STATE_PREFIX.length);

export type TrackingNotificationKind = 'running' | 'paused' | 'stopped';

export type TrackingNotificationPreset = {
  icon: string;
  color: TColor;
  titleKey: string;
  bodyKey: string;
  action?: TNotificationAction['type'];
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
