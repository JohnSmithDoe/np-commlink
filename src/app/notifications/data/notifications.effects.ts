import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, from, mergeMap, of, withLatestFrom } from 'rxjs';
import dayjs from 'dayjs';
import { IAppState, INotification, ITrackingItem } from '../../@shared/types';
import { trackingActions } from '../../tracking/data/tracking.actions';
import { notificationsActions } from './notifications.actions';
import { uuidv4 } from '../../@shared/util/app.utils';

@Injectable({ providedIn: 'root' })
export class NotificationsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  triggerAction$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(notificationsActions.triggerAction),
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
        if (!item) return of(notificationsActions.markDone(notification.id));

        // toggleTrackingItem looks at item.state: 'running' → stop, else start.
        // The CTA tells us which side of the toggle the user wants, so we
        // flip the state hint to force the matching branch in the reducer.
        const hintState: ITrackingItem['state'] =
          notification.action.type === 'tracking.start' ? 'stopped' : 'running';
        const triggered = trackingActions.toggleTrackingItem(
          { ...item, state: hintState },
          dayjs().format()
        );

        return from([
          triggered,
          notificationsActions.markDone(notification.id),
        ]);
      })
    );
  });

  addDebugNotification$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(notificationsActions.addDebugNotification),
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
        return of(notificationsActions.addNotification(notification));
      })
    );
  });
}
