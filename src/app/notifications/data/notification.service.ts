import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { NOTIFICATION_SOURCES } from '../../@shared/model/notification-sources';

const REMINDER_TITLE = marker('notifications.office-reminder.title');
const REMINDER_BODY = marker('notifications.office-reminder.body');

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly #notifications = inject(LocalNotificationsService);

  private static readonly OFFICE_REMINDER_HOUR = 9;
  private static readonly OFFICE_REMINDER_MINUTE = 0;

  async init(): Promise<void> {
    try {
      await this.#notifications.scheduleDaily({
        source: 'officeReminder',
        titleKey: REMINDER_TITLE,
        bodyKey: REMINDER_BODY,
        hour: NotificationService.OFFICE_REMINDER_HOUR,
        minute: NotificationService.OFFICE_REMINDER_MINUTE,
      });
    } catch {}
  }

  async fireTestNotification(): Promise<void> {
    try {
      await this.#scheduleTestNotification();
    } catch (error) {
      console.error('[notif] error', error);
    }
  }

  async #scheduleTestNotification(): Promise<void> {
    if (!(await this.#notifications.requestPermission())) return;
    await this.#notifications.schedule({
      id: NOTIFICATION_SOURCES.debugPing.id,
      source: 'debugPing',
      title: 'Test',
      body: 'Wenn du das siehst, funktionieren Notifications.',
      at: new Date(Date.now() + 2000),
    });
  }
}
