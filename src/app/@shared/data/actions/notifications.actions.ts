import { createActionGroup } from '@ngrx/store';
import dayjs from 'dayjs';
import {
  INotification,
  IToastMessage,
  TProjectedNotification,
} from '../../model/notifications.types';

/**
 * Published notification-write contract — the @shared half of the notifications
 * aggregate, symmetric to `DashboardActions.report`: a producer reaches the sink
 * without being able to see it, so notifications imports no domain and no domain
 * imports notifications.
 *
 * The slice receiving these is EAGER (composed into `provideAppKernel()`).
 * Notifications is a fan-in sink
 * — every route writes to it and the shell badge reads it — so it cannot be
 * scoped to any one producer's route lifecycle. That is what lets a producer
 * dispatch instead of writing storage behind the reducer's back.
 *
 * `toast` extends the same contract to the transient case, which is why there is
 * no toast *service*: telling the user something is telling the notifications
 * domain, whether the message is worth keeping or not.
 *
 * The contract is write-ONLY, and `project` is what makes that affordable. A
 * producer that keeps a set of rows in sync with its own state used to need the
 * current inbox to merge against — so @shared also published the slice's root
 * selector, and named another domain's store key to do it. Handing the whole set
 * over instead moves the merge into the reducer, where it belongs: the aggregate
 * decides what a re-projection means for rows the user has since touched.
 *
 * The inbox's own lifecycle and view state (`load`/`loaded`, done-section,
 * page-viewed, debug trigger) is a separate notifications-owned group
 * (`NotificationsInboxActions`, same `'Notifications'` source string) — the same
 * split as `DashboardActions` vs `DashboardReadModelActions`.
 *
 * **The two events that stamp a time carry it in the payload, defaulted here.**
 * The reducer used to read `dayjs()` itself, which made it a function of more
 * than (state, action): replaying a recorded action produced a different state
 * than the one recorded, and every spec over it could only assert "not the old
 * value". Capturing the clock in the creator is the conventional place for it —
 * the action becomes the complete description of what happened. The default is
 * what keeps this off every producer's call site: a producer describes data, and
 * "when" is not something it should have to know to reach the sink.
 */
export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    /** Publish (or refresh) a notification — replaces one with the same id. */
    notify: (notification: INotification) => ({ notification }),
    /**
     * Declare the complete set of rows `owner` publishes: rows it no longer
     * projects are dropped, so a producer never has to hunt down its own stale
     * entries. Rows other owners published are left alone.
     */
    project: (
      owner: string,
      notifications: TProjectedNotification[],
      at: string = dayjs().format()
    ) => ({ owner, notifications, at }),
    /** Mark handled: it stays in the inbox's done section. */
    dismiss: (id: string, at: string = dayjs().format()) => ({ id, at }),
    /** Drop it entirely — the reason it existed is gone. */
    remove: (id: string) => ({ id }),
    /** Flash a message; no reducer reacts — it never enters the inbox. */
    toast: (message: IToastMessage) => ({ message }),
  },
});
