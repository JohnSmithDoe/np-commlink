import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { from, mergeMap, timer, withLatestFrom } from 'rxjs';
import { IAppState, INotification, ITrackingItem } from '../../@shared/types';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { TrackingActions } from '../../tracking/data/tracking.actions';
import { NotificationsActions } from './notifications.actions';
import {
  isTrackingStateNotificationId,
  kindForState,
  runningDurationMinutes,
  TRACKING_NOTIFICATION_PRESETS,
  trackingItemIdFromNotificationId,
  TrackingNotificationKind,
  trackingStateNotificationId,
} from './notifications-from-tracking.utils';

// Testing cadence. Production should use 60 * 60 * 1000 (1h).
const RUNNING_UPDATE_INTERVAL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificationsFromTrackingEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #translate = inject(TranslateService);

  // Single reconciler: any tracking-page-side mutation rebuilds notifications
  // from the post-reducer state. Rule: an item owns a state notification
  // iff it's been touched (has startTime) or already had one. Orphaned
  // notifications (item no longer exists) are dropped. The action target
  // (the item the user actually interacted with) is upserted so it lands
  // on top; cascading items are synced in place to avoid reordering them
  // when their state changed as a side-effect.
  reconcileState$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        TrackingActions.toggleTrackingItem,
        TrackingActions.resetTracking,
        TrackingActions.resetAllTracking,
        TrackingActions.saveAndResetTracking,
        TrackingActions.removeItem
      ),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      mergeMap(({ action, state }) =>
        from(this.#reconcile(state, this.#targetIdOf(action)))
      )
    );
  });

  runningUpdates$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ApplicationActions.loadedSuccessfully),
      mergeMap(() =>
        timer(RUNNING_UPDATE_INTERVAL_MS, RUNNING_UPDATE_INTERVAL_MS).pipe(
          withLatestFrom(this.#store, (_, state: IAppState) => state),
          mergeMap((state) => {
            const running = state.tracking.items.filter(
              (i) => i.state === 'running'
            );
            const updates = running.map((item) =>
              NotificationsActions.updateNotificationBody(
                trackingStateNotificationId(item.id),
                this.#translate.instant(
                  'notifications.tracking.running.update',
                  {
                    name: item.name,
                    minutes: runningDurationMinutes(item),
                  }
                )
              )
            );
            return from(updates);
          })
        )
      )
    );
  });

  #reconcile(state: IAppState, targetId: string | undefined): Action[] {
    const liveItemsById = new Map(
      state.tracking.items.map((i) => [i.id, i] as const)
    );
    const existingNotificationsById = new Map(
      state.notifications.items.map((n) => [n.id, n] as const)
    );
    const itemIdsWithNotification = new Set<string>();
    const actions: Action[] = [];

    for (const n of state.notifications.items) {
      if (!isTrackingStateNotificationId(n.id)) continue;
      const itemId = trackingItemIdFromNotificationId(n.id);
      if (liveItemsById.has(itemId)) {
        itemIdsWithNotification.add(itemId);
      } else {
        actions.push(NotificationsActions.removeNotification(n.id));
      }
    }

    const now = dayjs().format();
    for (const item of state.tracking.items) {
      const touched = !!item.startTime || itemIdsWithNotification.has(item.id);
      if (!touched) continue;
      // Bump updatedAt when the item is the action target OR its state
      // actually changed as a cascade side-effect. Cascade items whose
      // state didn't change keep their old updatedAt so they don't drift
      // to the top of the list (or the badge) on every unrelated toggle.
      const existing = existingNotificationsById.get(
        trackingStateNotificationId(item.id)
      );
      const newKind = kindForState(item.state);
      const isTarget = item.id === targetId;
      const stateChanged =
        !!existing && this.#previousKind(existing) !== newKind;
      const updatedAt =
        isTarget || stateChanged ? now : (existing?.updatedAt ?? now);
      actions.push(
        NotificationsActions.upsertNotification(
          this.#buildNotification(item, newKind, updatedAt)
        )
      );
    }

    return actions;
  }

  #targetIdOf(action: {
    type: string;
    item?: { id: string };
  }): string | undefined {
    return action.item?.id;
  }

  #previousKind(existing: INotification): TrackingNotificationKind {
    switch (existing.action?.type) {
      case 'tracking.pause':
        return 'running';
      case 'tracking.start':
        return 'paused';
      default:
        return 'stopped';
    }
  }

  #buildNotification(
    item: ITrackingItem,
    kind: TrackingNotificationKind,
    updatedAt: string
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
      createdAt: dayjs().format(),
      updatedAt,
      trackingItemId: item.id,
      action: preset.action
        ? { type: preset.action, trackingItemId: item.id }
        : undefined,
    };
  }
}
