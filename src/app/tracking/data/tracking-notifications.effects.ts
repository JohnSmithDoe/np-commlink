import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { from, mergeMap, withLatestFrom } from 'rxjs';
import { INotification, INotificationsState } from '../../@shared/types';
import { ITrackingItem, ITrackingState } from '../model';
import { NotificationsStore } from '../../@shared/util/notifications/notifications.store';
import { selectTrackingState } from './tracking.selector';
import {
  markNotificationDone,
  removeNotificationById,
  upsertNotification,
} from '../../@shared/util/notifications/notifications.transforms';
import { TrackingActions } from './tracking.actions';
import {
  isTrackingStateNotificationId,
  kindForState,
  runningDurationMinutes,
  TRACKING_NOTIFICATION_PRESETS,
  trackingItemIdFromNotificationId,
  TrackingNotificationKind,
  trackingStateNotificationId,
} from './tracking-notifications.utils';

// Tracking owns its one-directional coupling to notifications. Notifications is
// LAZY (§7), so its reducer may be unregistered while these effects run (they
// fire on the /tracking route). So tracking does NOT dispatch NotificationsActions
// — it writes the DURABLE `npc-notifications` doc through NotificationsStore,
// reusing the notifications reducer's pure transforms so the off-route (here)
// and on-route (reducer) paths are identical. Each durable write reports the new
// unread count to the eager dashboard read-model, keeping the badge live. It
// reads its OWN slice (state.tracking, present on /tracking) but reads
// notifications from disk (via the store), never state.notifications.
@Injectable({ providedIn: 'root' })
export class TrackingNotificationsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #translate = inject(TranslateService);
  #notifications = inject(NotificationsStore);

  // Any tracking-side mutation rebuilds the tracking-state notifications in the
  // durable doc (dispatch:false — the write is a side effect, not an action).
  reconcileState$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(
          TrackingActions.toggleTrackingItem,
          TrackingActions.resetTracking,
          TrackingActions.resetAllTracking,
          TrackingActions.saveAndResetTracking,
          TrackingActions.removeItem
        ),
        withLatestFrom(
          this.#store.select(selectTrackingState),
          (action, tracking) => ({ action, tracking })
        ),
        mergeMap(({ action, tracking }) => {
          const now = dayjs().format();
          const targetId = this.#targetIdOf(action);
          return from(
            this.#notifications
              .mutate((notif) =>
                this.#reconcile(notif, tracking, targetId, now)
              )
              // A transient storage failure must not kill the effect stream.
              .catch(() => {})
          );
        })
      );
    },
    { dispatch: false }
  );

  // A tracking notification's CTA (tapped on the eager /notifications page)
  // deep-links to /tracking?cmd=<id>; the tracking page dispatches this. We read
  // the durable notification, then toggle the tracking item — the toggle
  // triggers reconcileState$, which durably updates the notification to the
  // item's new state. A gone item's stale notification is dismissed durably.
  applyNotificationCommand$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.applyNotificationCommand),
      withLatestFrom(
        this.#store.select(selectTrackingState),
        (action, tracking) => ({ action, tracking })
      ),
      mergeMap(({ action, tracking }) =>
        from(
          this.#applyCommand(action.notificationId, tracking).catch(
            () => [] as Action[]
          )
        ).pipe(mergeMap((actions) => actions))
      )
    );
  });

  async #applyCommand(
    notificationId: string,
    trackingState: ITrackingState
  ): Promise<Action[]> {
    const notifications = await this.#notifications.read();
    const notification = notifications.items.find(
      (n) => n.id === notificationId
    );
    if (!notification?.action) return [];
    const item = trackingState.items.find(
      (index) => index.id === notification.action!.trackingItemId
    );
    if (!item) {
      // The tracking item is gone: no toggle to fire and reconcile won't run,
      // so dismiss the stale notification durably.
      await this.#notifications.mutate((s) => ({
        ...s,
        items: markNotificationDone(s.items, notification.id, dayjs().format()),
      }));
      return [];
    }
    // toggleTrackingItem looks at item.state: 'running' → stop, else start. The
    // CTA tells us which side the user wants, so flip the hint to force the
    // matching reducer branch.
    const hintState: ITrackingItem['state'] =
      notification.action.type === 'tracking.start' ? 'stopped' : 'running';
    return [
      TrackingActions.toggleTrackingItem(
        { ...item, state: hintState },
        dayjs().format()
      ),
    ];
  }

  // Pure (given #translate): rebuild the tracking-state notifications inside the
  // passed notifications state. Non-tracking notifications (debug etc.) are left
  // untouched; orphans (item gone) are removed; touched items are upserted.
  #reconcile(
    notifState: INotificationsState,
    trackingState: ITrackingState,
    targetId: string | undefined,
    now: string
  ): INotificationsState {
    const liveItemsById = new Map(
      trackingState.items.map((index) => [index.id, index] as const)
    );
    const existingById = new Map(
      notifState.items.map((n) => [n.id, n] as const)
    );
    const itemIdsWithNotification = new Set<string>();
    let items = notifState.items;

    for (const n of notifState.items) {
      if (!isTrackingStateNotificationId(n.id)) continue;
      const itemId = trackingItemIdFromNotificationId(n.id);
      if (liveItemsById.has(itemId)) {
        itemIdsWithNotification.add(itemId);
      } else {
        items = removeNotificationById(items, n.id);
      }
    }

    for (const item of trackingState.items) {
      const touched = !!item.startTime || itemIdsWithNotification.has(item.id);
      if (!touched) continue;
      // Bump updatedAt when the item is the action target OR its kind actually
      // changed as a cascade side-effect; otherwise keep the old updatedAt so
      // cascade items don't drift to the top on every unrelated toggle.
      const existing = existingById.get(trackingStateNotificationId(item.id));
      const newKind = kindForState(item.state);
      const isTarget = item.id === targetId;
      const stateChanged =
        !!existing && this.#previousKind(existing) !== newKind;
      const updatedAt =
        isTarget || stateChanged ? now : (existing?.updatedAt ?? now);
      items = upsertNotification(
        items,
        this.#buildNotification(item, newKind, updatedAt, now)
      );
    }

    return { ...notifState, items };
  }

  #targetIdOf(action: {
    type: string;
    item?: { id: string };
  }): string | undefined {
    return action.item?.id;
  }

  #previousKind(existing: INotification): TrackingNotificationKind {
    switch (existing.action?.type) {
      case 'tracking.pause': {
        return 'running';
      }
      case 'tracking.start': {
        return 'paused';
      }
      default: {
        return 'stopped';
      }
    }
  }

  #buildNotification(
    item: ITrackingItem,
    kind: TrackingNotificationKind,
    updatedAt: string,
    now: string
  ): INotification {
    const preset = TRACKING_NOTIFICATION_PRESETS[kind];
    return {
      id: trackingStateNotificationId(item.id),
      name: this.#translate.instant(preset.titleKey, { name: item.name }),
      body: this.#translate.instant(preset.bodyKey, {
        name: item.name,
        minutes: runningDurationMinutes(item),
      }),
      icon: preset.icon,
      color: preset.color,
      status: 'new',
      createdAt: now,
      updatedAt,
      trackingItemId: item.id,
      action: preset.action
        ? { type: preset.action, trackingItemId: item.id }
        : undefined,
    };
  }
}
