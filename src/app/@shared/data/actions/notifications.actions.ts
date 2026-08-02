import { createActionGroup } from '@ngrx/store';
import dayjs from 'dayjs';
import {
  ToastMessage,
  InboxNotification,
  ProjectedNotification,
} from '../../model/notifications.types';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    notify: (notification: InboxNotification) => ({ notification }),
    project: (
      owner: string,
      notifications: ProjectedNotification[],
      at: string = dayjs().format()
    ) => ({ owner, notifications, at }),
    dismiss: (id: string, at: string = dayjs().format()) => ({ id, at }),
    remove: (id: string) => ({ id }),
    toast: (message: ToastMessage) => ({ message }),
  },
});
