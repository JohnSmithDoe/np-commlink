import { createActionGroup, emptyProps } from '@ngrx/store';
import dayjs from 'dayjs';

import { INotificationsState } from '../../@shared/model/notifications.types';

/**
 * The inbox's own actions: its load lifecycle and the view state only this page
 * has an opinion about. The write vocabulary every producer shares (`notify` /
 * `dismiss` / `remove`) is the published contract in `@shared/data/actions` —
 * same `'Notifications'` source string, but the two groups persist through a
 * hand-maintained explicit `on:` list on `notificationsContext`, not a
 * source-prefixed trigger: the shared contract's `toast` must never persist,
 * so the trigger can't just match every `[Notifications]`-prefixed action.
 */
export const NotificationsInboxActions = createActionGroup({
  source: 'Notifications',
  events: {
    load: emptyProps(),
    loaded: (notifications: INotificationsState | null) => ({ notifications }),

    clearDone: emptyProps(),
    toggleDoneSection: emptyProps(),
    addDebugNotification: emptyProps(),
    // Carries the moment, defaulted, for the same reason `project`/`dismiss` do
    // on the published contract: the reducer that consumes it stays a function
    // of (state, action) alone.
    markPageViewed: (at: string = dayjs().format()) => ({ at }),
  },
});
