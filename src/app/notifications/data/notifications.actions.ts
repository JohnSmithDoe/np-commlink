import { createActionGroup, emptyProps } from '@ngrx/store';
import dayjs from 'dayjs';

import { NotificationsState } from '../../@shared/model/notifications.types';

export const NotificationsInboxActions = createActionGroup({
  source: 'Notifications',
  events: {
    load: emptyProps(),
    loaded: (notifications: NotificationsState | null) => ({ notifications }),

    clearDone: emptyProps(),
    legacyCronsCleared: emptyProps(),
    toggleDoneSection: emptyProps(),
    addDebugNotification: emptyProps(),
    markPageViewed: (at: string = dayjs().format()) => ({ at }),
  },
});
