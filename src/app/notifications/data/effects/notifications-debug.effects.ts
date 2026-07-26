import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import dayjs from 'dayjs';
import { map } from 'rxjs';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from '../actions/notifications.actions';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { INotification } from '../../../@shared/model/notifications.types';

// Debug-only helper. It used to read a random real tracking item to build an
// actionable notification, which coupled notifications → tracking. Now it is
// self-contained: it fabricates a notification against a synthetic target id, so
// the deck badge + the CTA deep-link flow (/tracking?cmd=…) can be exercised
// end-to-end. Tapping the CTA opens tracking, which finds no matching item and
// simply marks it done — the graceful no-op path. No tracking import, no
// tracking-state read.
//
// The command strings below are a deliberate STUB of tracking's vocabulary, not
// a dependency on it: `action.type` is opaque to the notifications port, and a
// debug fixture has to name something for the CTA to route. If tracking renames
// a command this fixture just exercises the stale-command path, which is also
// worth covering.
type TDebugCommand = 'tracking.start' | 'tracking.stop' | 'tracking.pause';
type DebugPreset = {
  icon: string;
  color: INotification['color'];
  title: string;
  body: string;
};

const DEBUG_PRESETS: Record<TDebugCommand, DebugPreset> = {
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

const DEBUG_TYPES = Object.keys(DEBUG_PRESETS) as TDebugCommand[];

@Injectable({ providedIn: 'root' })
export class NotificationsDebugEffects {
  readonly #actions$ = inject(Actions);

  addDebugNotification$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(NotificationsInboxActions.addDebugNotification),
      map(() => {
        const type =
          DEBUG_TYPES[Math.floor(Math.random() * DEBUG_TYPES.length)];
        const preset = DEBUG_PRESETS[type];
        const now = dayjs().format();
        const targetId = uuidv4();
        const notification: INotification = {
          id: uuidv4(),
          name: preset.title,
          body: preset.body,
          icon: preset.icon,
          color: preset.color,
          status: 'new',
          createdAt: now,
          updatedAt: now,
          action: { type, targetId },
        };
        return NotificationsActions.notify(notification);
      })
    );
  });
}
