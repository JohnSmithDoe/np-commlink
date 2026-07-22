import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import dayjs from 'dayjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
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

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NotificationService.OFFICE_REMINDER_ID,
          title: 'Bürotag heute?',
          body: 'Vergiss nicht, deine Anwesenheit zu erfassen.',
          schedule: {
            at: this.#nextOfficeReminderTime(),
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

  #nextOfficeReminderTime(): Date {
    const target = dayjs()
      .hour(NotificationService.OFFICE_REMINDER_HOUR)
      .minute(NotificationService.OFFICE_REMINDER_MINUTE)
      .second(0)
      .millisecond(0);
    return (target.isAfter(dayjs()) ? target : target.add(1, 'day')).toDate();
  }
}
