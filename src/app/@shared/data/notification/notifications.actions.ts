import { createActionGroup, emptyProps } from '@ngrx/store';
import { INotification, INotificationsState } from '../../model/types';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2).
    load: emptyProps(),
    loaded: (notifications: INotificationsState | null) => ({ notifications }),

    'Add Notification': (notification: INotification) => ({ notification }),
    'Upsert Notification': (notification: INotification) => ({ notification }),
    'Mark Done': (id: string) => ({ id }),
    'Mark New': (id: string) => ({ id }),
    'Remove Notification': (id: string) => ({ id }),
    'Clear Done': emptyProps(),
    'Toggle Done Section': emptyProps(),
    'Add Debug Notification': emptyProps(),
    'Mark Page Viewed': emptyProps(),
  },
});
