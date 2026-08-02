import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { map } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from './notifications.actions';
import { uuidv4 } from '../../@shared/util/app.utils';
import { Marker } from '../../@shared/model/app.types';
import { InboxNotification } from '../../@shared/model/notifications.types';

const DEBUG_COMMANDS = ['debug.start', 'debug.stop', 'debug.pause'] as const;
type DebugCommand = (typeof DEBUG_COMMANDS)[number];

const randomDebugCommand = (): DebugCommand =>
  DEBUG_COMMANDS[Math.floor(Math.random() * DEBUG_COMMANDS.length)] ??
  DEBUG_COMMANDS[0];
type DebugPreset = {
  icon: string;
  color: InboxNotification['color'];
  titleKey: Marker;
  bodyKey: Marker;
  labelKey: Marker;
};

const DEBUG_PRESETS: Record<DebugCommand, DebugPreset> = {
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
        const notification: InboxNotification = {
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
