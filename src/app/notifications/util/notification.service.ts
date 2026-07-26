import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { LocalNotifications } from '@capacitor/local-notifications';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { nextDailyOccurrence } from './notification-schedule.utils';

const REMINDER_TITLE = marker('notifications.office-reminder.title');
const REMINDER_BODY = marker('notifications.office-reminder.body');

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly #translate = inject(TranslateService);

  private static readonly OFFICE_REMINDER_ID = 1;
  private static readonly OFFICE_REMINDER_HOUR = 9;
  private static readonly OFFICE_REMINDER_MINUTE = 0;

  async init(): Promise<void> {
    try {
      await this.#scheduleOfficeReminder();
    } catch {
      // Plugin not available (unsupported browser, permission API blocked) —
      // fail silently. The app should work without notifications.
    }
  }

  async fireTestNotification(): Promise<void> {
    try {
      await this.#scheduleTestNotification();
    } catch (error) {
      console.error('[notif] error', error);
    }
  }

  async #scheduleOfficeReminder(): Promise<void> {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    await LocalNotifications.cancel({
      notifications: [{ id: NotificationService.OFFICE_REMINDER_ID }],
    });

    // `get`, not `instant`: this runs on the eager boot path, where the
    // translation bundle may not have loaded yet and `instant` would schedule a
    // notification whose text is the raw key.
    const copy = await firstValueFrom(
      this.#translate.get([REMINDER_TITLE, REMINDER_BODY])
    );

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NotificationService.OFFICE_REMINDER_ID,
          title: copy[REMINDER_TITLE],
          body: copy[REMINDER_BODY],
          schedule: {
            at: nextDailyOccurrence(
              NotificationService.OFFICE_REMINDER_HOUR,
              NotificationService.OFFICE_REMINDER_MINUTE
            ),
            every: 'day',
            allowWhileIdle: true,
          },
        },
      ],
    });
  }

  async #scheduleTestNotification(): Promise<void> {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 1_000_000_000),
          title: 'Test',
          body: 'Wenn du das siehst, funktionieren Notifications.',
          schedule: { at: new Date(Date.now() + 2000) },
        },
      ],
    });
  }
}
