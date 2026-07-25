import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import dayjs from 'dayjs';
import { map } from 'rxjs';
import {
  INotification,
  TNotificationActionType,
} from '../../../@shared/model/types';
import { NotificationsActions } from '../../../@shared/data/notification/notifications.actions';
import { uuidv4 } from '../../../@shared/util/app.utils';

// Debug-only helper. It used to read a random real tracking item to build an
// actionable notification, which coupled notifications → tracking. Now it is
// self-contained: it fabricates a plausible tracking-flavoured notification
// with a synthetic trackingItemId, so the deck badge + the CTA deep-link flow
// (/tracking?cmd=…) can be exercised end-to-end. Tapping the CTA opens
// tracking, which finds no matching item and simply marks it done — the
// graceful no-op path. No tracking import, no tracking-state read.
type DebugPreset = {
  icon: string;
  color: INotification['color'];
  title: string;
  body: string;
};

const DEBUG_PRESETS: Record<TNotificationActionType, DebugPreset> = {
  'tracking.start': {
    icon: 'play-circle',
    color: 'primary',
    title: 'Tracker starten?',
    body: 'Debug-Eintrag ist seit einer Weile inaktiv.',
  },
  'tracking.stop': {
    icon: 'stop-circle',
    color: 'warning',
    title: 'Tracker läuft lange',
    body: 'Debug-Eintrag läuft seit über 4 Stunden.',
  },
  'tracking.pause': {
    icon: 'pause-circle',
    color: 'medium',
    title: 'Pause vergessen?',
    body: 'Möchtest du den Debug-Eintrag pausieren?',
  },
};

const DEBUG_TYPES = Object.keys(DEBUG_PRESETS) as TNotificationActionType[];

@Injectable({ providedIn: 'root' })
export class NotificationsDebugEffects {
  #actions$ = inject(Actions);

  addDebugNotification$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(NotificationsActions.addDebugNotification),
      map(() => {
        const type =
          DEBUG_TYPES[Math.floor(Math.random() * DEBUG_TYPES.length)];
        const preset = DEBUG_PRESETS[type];
        const now = dayjs().format();
        const trackingItemId = uuidv4();
        const notification: INotification = {
          id: uuidv4(),
          name: preset.title,
          body: preset.body,
          icon: preset.icon,
          color: preset.color,
          status: 'new',
          createdAt: now,
          updatedAt: now,
          trackingItemId,
          action: { type, trackingItemId },
        };
        return NotificationsActions.addNotification(notification);
      })
    );
  });
}
