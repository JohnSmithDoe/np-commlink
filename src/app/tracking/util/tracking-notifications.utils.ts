import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { IonColor, Marker } from '../../@shared/model/app.types';
import { TrackingCommand, TrackingItem } from '../model/tracking.types';

marker('notifications.tracking.running.title');
marker('notifications.tracking.running.body');
marker('notifications.tracking.paused.title');
marker('notifications.tracking.paused.body');
marker('notifications.tracking.stopped.title');
marker('notifications.tracking.stopped.body');
marker('notifications.action.start');
marker('notifications.action.pause');

const TRACKING_STATE_PREFIX = 'tracking-page-state:';

export const TRACKING_NOTIFICATIONS_OWNER = 'tracking';

export const trackingStateNotificationId = (itemId: string) =>
  `${TRACKING_STATE_PREFIX}${itemId}`;

export type TrackingNotificationKind = 'running' | 'paused' | 'stopped';

type TrackingNotificationPreset = {
  icon: string;
  color: IonColor;
  titleKey: string;
  bodyKey: string;
  cta?: { type: TrackingCommand; labelKey: Marker };
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
    cta: { type: 'tracking.pause', labelKey: 'notifications.action.pause' },
  },
  paused: {
    icon: 'pause-circle',
    color: 'warning',
    titleKey: 'notifications.tracking.paused.title',
    bodyKey: 'notifications.tracking.paused.body',
    cta: { type: 'tracking.start', labelKey: 'notifications.action.start' },
  },
  stopped: {
    icon: 'stop-circle',
    color: 'medium',
    titleKey: 'notifications.tracking.stopped.title',
    bodyKey: 'notifications.tracking.stopped.body',
  },
};

export const kindForState = (
  state: TrackingItem['state']
): TrackingNotificationKind =>
  state === 'running' ? 'running' : state === 'paused' ? 'paused' : 'stopped';

export const runningDurationMinutes = (
  item: TrackingItem,
  now = dayjs()
): number => {
  if (!item.startTime) return 0;
  const tracked =
    now.diff(dayjs(item.startTime), 'seconds') - (item.breakInSeconds ?? 0);
  return Math.max(0, Math.floor(tracked / 60));
};

export const needsStateNotification = (item: TrackingItem): boolean =>
  !!item.startTime;

export const stateHintForCta = (cta: string): TrackingItem['state'] =>
  cta === ('tracking.start' satisfies TrackingCommand) ? 'stopped' : 'running';
