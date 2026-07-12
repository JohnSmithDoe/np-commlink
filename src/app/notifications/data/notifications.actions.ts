import { createActionGroup, emptyProps } from '@ngrx/store';
import { INotification } from '../../@shared/types';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Add Notification': (notification: INotification) => ({ notification }),
    'Upsert Notification': (notification: INotification) => ({ notification }),
    'Update Notification Body': (id: string, body: string) => ({ id, body }),
    'Mark Done': (id: string) => ({ id }),
    'Mark New': (id: string) => ({ id }),
    'Remove Notification': (id: string) => ({ id }),
    'Clear Done': emptyProps(),
    'Toggle Done Section': emptyProps(),
    'Trigger Action': (id: string) => ({ id }),
    'Add Debug Notification': emptyProps(),
    'Mark Page Viewed': emptyProps(),
  },
});
