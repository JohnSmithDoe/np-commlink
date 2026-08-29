import { IonColor, Marker, Timestamp } from './app.types';
import { BaseItem } from './base-item.types';

type NotificationAction = {
  type: string;
  targetId: string;
  labelKey: Marker;
};

type NotificationOrigin = {
  owner: string;
  variant: string;
};

export type InboxNotification = BaseItem & {
  body: string;
  icon: string;
  color: IonColor;
  status: 'open' | 'done';
  updatedAt: Timestamp;
  origin?: NotificationOrigin;
  action?: NotificationAction;
};

export type ProjectedNotification = Omit<
  InboxNotification,
  'createdAt' | 'updatedAt' | 'origin' | 'status'
> & {
  variant: string;
  updatedAt?: Timestamp;
};

export interface NotificationsState {
  items: InboxNotification[];
  doneCollapsed: boolean;
  lastViewedAt: Timestamp;
  legacyCronsCleared?: boolean;
}

export interface ToastMessage {
  key: Marker;
  parameters?: Record<string, string | number>;
  color?: IonColor;
  durationMs?: number;
  group?: string;
}
