import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { EMPTY, from, mergeMap, of, timer, withLatestFrom } from 'rxjs';
import { IAppState, INotification, ITrackingItem } from '../../@shared/types';
import { NotificationsActions } from '../../@shared/data/notifications/notifications.actions';
import { uuidv4 } from '../../@shared/util/app.utils';
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

// Testing cadence. Production should use 60 * 60 * 1000 (1h).
const RUNNING_UPDATE_INTERVAL_MS = 60_000;

// Tracking owns the coupling to notifications: it reads its own state
// (state.tracking, same domain) and the notifications slice by shape
// (state.notifications via IAppState — a type-level read, not a code
// import of the notifications domain) and dispatches the @shared
// notification write-action contract. Notifications never imports tracking.
@Injectable({ providedIn: 'root' })
export class TrackingNotificationsEffects {
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
      ofType(TrackingActions.loaded),
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

  triggerAction$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(NotificationsActions.triggerAction),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      mergeMap(({ action, state }) => {
        const notification = state.notifications.items.find(
          (n) => n.id === action.id
        );
        if (!notification?.action) return EMPTY;
        const trackingItemId = notification.action.trackingItemId;
        const item = state.tracking.items.find((i) => i.id === trackingItemId);
        if (!item) return of(NotificationsActions.markDone(notification.id));

        // toggleTrackingItem looks at item.state: 'running' → stop, else start.
        // The CTA tells us which side of the toggle the user wants, so we
        // flip the state hint to force the matching branch in the reducer.
        const hintState: ITrackingItem['state'] =
          notification.action.type === 'tracking.start' ? 'stopped' : 'running';
        const triggered = TrackingActions.toggleTrackingItem(
          { ...item, state: hintState },
          dayjs().format()
        );

        return from([
          triggered,
          NotificationsActions.markDone(notification.id),
        ]);
      })
    );
  });

  addDebugNotification$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(NotificationsActions.addDebugNotification),
      withLatestFrom(this.#store, (_, state: IAppState) => state),
      mergeMap((state) => {
        const items = state.tracking.items;
        const item: ITrackingItem | undefined = items.length
          ? items[Math.floor(Math.random() * items.length)]
          : undefined;

        const types = [
          'tracking.start',
          'tracking.stop',
          'tracking.pause',
        ] as const;
        const type = types[Math.floor(Math.random() * types.length)];

        const presets = {
          'tracking.start': {
            icon: 'play-circle',
            color: 'tracking' as const,
            title: 'Tracker starten?',
            body: item
              ? `${item.name} ist seit einer Weile inaktiv.`
              : 'Lege zuerst einen Tracking-Eintrag an.',
          },
          'tracking.stop': {
            icon: 'stop-circle',
            color: 'warning' as const,
            title: 'Tracker läuft lange',
            body: item
              ? `${item.name} läuft seit über 4 Stunden.`
              : 'Lege zuerst einen Tracking-Eintrag an.',
          },
          'tracking.pause': {
            icon: 'pause-circle',
            color: 'medium' as const,
            title: 'Pause vergessen?',
            body: item
              ? `Möchtest du ${item.name} pausieren?`
              : 'Lege zuerst einen Tracking-Eintrag an.',
          },
        };

        const preset = presets[type];
        const now = dayjs().format();
        const notification: INotification = {
          id: uuidv4(),
          name: preset.title,
          body: preset.body,
          icon: preset.icon,
          color: preset.color,
          status: 'new',
          createdAt: now,
          updatedAt: now,
          trackingItemId: item?.id,
          action: item ? { type, trackingItemId: item.id } : undefined,
        };
        return of(NotificationsActions.addNotification(notification));
      })
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
