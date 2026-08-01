import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { map } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from './notifications.actions';
import { uuidv4 } from '../../@shared/util/app.utils';
import { TMarker } from '../../@shared/model/app.types';
import { INotification } from '../../@shared/model/notifications.types';

// Debug-only helper. It used to read a random real tracking item to build an
// actionable notification, which coupled notifications → tracking. Now it is
// self-contained: it fabricates a notification against a synthetic target id, so
// the deck badge + the CTA deep-link flow (/tracking?cmd=…) can be exercised
// end-to-end. Tapping the CTA opens tracking, which finds no matching item and
// no-ops — the graceful stale-command path, and the branch worth covering here.
// No tracking import, no tracking-state read.
//
// The commands below are the fixture's own tokens rather than a stub of
// tracking's vocabulary: a command is opaque to the port, and the CTA's label
// travels with it, so nothing has to recognise a command to label its button.
// The commands as a value, so the random pick below reads the list itself rather
// than recovering it from `Object.keys(DEBUG_PRESETS)` through a cast. The derived
// union keeps the preset record exhaustive: a fourth command cannot be added
// without its preset.
const DEBUG_COMMANDS = ['debug.start', 'debug.stop', 'debug.pause'] as const;
type TDebugCommand = (typeof DEBUG_COMMANDS)[number];

// The fallback is unreachable — `Math.random()` never returns 1 — and is there
// only because an index built at runtime is typed as possibly out of range.
const randomDebugCommand = (): TDebugCommand =>
  DEBUG_COMMANDS[Math.floor(Math.random() * DEBUG_COMMANDS.length)] ??
  DEBUG_COMMANDS[0];
type DebugPreset = {
  icon: string;
  color: INotification['color'];
  // Keys, not literals, for the same reason the real producer uses them: the
  // inbox stores rendered text, so whoever publishes a row translates it. These
  // were German strings, which meant the one producer that could not follow the
  // convention was the fixture written to exercise it.
  titleKey: TMarker;
  bodyKey: TMarker;
  labelKey: TMarker;
};

const DEBUG_PRESETS: Record<TDebugCommand, DebugPreset> = {
  'debug.start': {
    icon: 'play-circle',
    color: 'primary',
    titleKey: marker('notifications.debug.start.title'),
    bodyKey: marker('notifications.debug.start.body'),
    labelKey: marker('notifications.action.start'),
  },
  'debug.stop': {
    icon: 'stop-circle',
    color: 'warning',
    titleKey: marker('notifications.debug.stop.title'),
    bodyKey: marker('notifications.debug.stop.body'),
    labelKey: marker('notifications.action.stop'),
  },
  'debug.pause': {
    icon: 'pause-circle',
    color: 'medium',
    titleKey: marker('notifications.debug.pause.title'),
    bodyKey: marker('notifications.debug.pause.body'),
    labelKey: marker('notifications.action.pause'),
  },
};

@Injectable({ providedIn: 'root' })
export class NotificationsDebugEffects {
  readonly #actions$ = inject(Actions);
  readonly #translate = inject(TranslateService);

  addDebugNotification$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(NotificationsInboxActions.addDebugNotification),
      map(() => {
        const type = randomDebugCommand();
        const preset = DEBUG_PRESETS[type];
        const now = dayjs().format();
        const targetId = uuidv4();
        const notification: INotification = {
          id: uuidv4(),
          name: this.#translate.instant(preset.titleKey),
          body: this.#translate.instant(preset.bodyKey),
          icon: preset.icon,
          color: preset.color,
          status: 'open',
          createdAt: now,
          updatedAt: now,
          action: { type, targetId, labelKey: preset.labelKey },
        };
        return NotificationsActions.notify(notification);
      })
    );
  });
}
