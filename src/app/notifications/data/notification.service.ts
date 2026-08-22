import { inject, Injectable } from '@angular/core';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { NOTIFICATION_SOURCES } from '../../@shared/model/notification-sources';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly #notifications = inject(LocalNotificationsService);

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
