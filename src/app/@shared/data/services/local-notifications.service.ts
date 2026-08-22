/* ─── why ─────────────────────────────────────────────────────────
 * The platform half of a reminder, and nothing else: it holds no state
 * and decides no schedule. Every domain that reminds needs to reach the
 * OS, but no domain may reach another, so the capability lives here and
 * the policy — when, whose wording, whether to remind at all — stays
 * with the domain that owns the concept. It resolves i18n keys without
 * ever naming one: the key arrives as an argument, so no domain's
 * wording is owned here.
 *
 * A daily reminder is an `on` cron and never `at` + `every` — the OS reads
 * those as alternatives, not modifiers, and the browser has no cron at all,
 * so a daily one refuses off-native rather than appearing to arm. Both
 * traps, and what `allowWhileIdle` does not buy, are in docs/footguns.md.
 * The cost of the cron is that the OS owns the next occurrence: it nudges
 * on a day already finished, which is the right way to be wrong.
 *
 * A weekly cron is the same `on` branch with `weekday` set — the plugin
 * takes the FIRST field given as its repeat unit, so naming weekday before
 * hour re-arms a week later rather than a day. Its numbering starts at
 * Sunday, which no domain should have to hold: callers pass an ISO weekday
 * (Monday 1 … Sunday 7) and the conversion stays on this side, so a
 * persisted schedule never encodes a plugin's enum.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, Weekday } from '@capacitor/local-notifications';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { IsoWeekday } from '../../model/app.types';
import {
  FixedIdSource,
  NOTIFICATION_SOURCES,
  NotificationSource,
} from '../../model/notification-sources';

export const LOCAL_NOTIFICATIONS = new InjectionToken<
  typeof LocalNotifications
>('LocalNotifications plugin', {
  providedIn: 'root',
  factory: () => LocalNotifications,
});

export const IS_NATIVE_PLATFORM = new InjectionToken<boolean>(
  'Capacitor native platform',
  { providedIn: 'root', factory: () => Capacitor.isNativePlatform() }
);

type ScheduledReminder = {
  id: number;
  source?: NotificationSource;
  title: string;
  body: string;
  at: Date;
};

const asNotificationSource = (
  extra: unknown
): NotificationSource | undefined => {
  const source = (extra as { source?: unknown } | null | undefined)?.source;
  return typeof source === 'string' && source in NOTIFICATION_SOURCES
    ? (source as NotificationSource)
    : undefined;
};

type DailyReminder = {
  source: FixedIdSource;
  titleKey: string;
  bodyKey: string;
  hour: number;
  minute: number;
};

type WeeklyReminder = {
  id: number;
  source: NotificationSource;
  titleKey: string;
  bodyKey: string;
  parameters: Record<string, string>;
  isoWeekday: IsoWeekday;
  hour: number;
  minute: number;
};

const OS_WEEKDAY: Readonly<Record<IsoWeekday, Weekday>> = {
  1: Weekday.Monday,
  2: Weekday.Tuesday,
  3: Weekday.Wednesday,
  4: Weekday.Thursday,
  5: Weekday.Friday,
  6: Weekday.Saturday,
  7: Weekday.Sunday,
};

@Injectable({ providedIn: 'root' })
export class LocalNotificationsService {
  readonly #translate = inject(TranslateService);
  readonly #plugin = inject(LOCAL_NOTIFICATIONS);
  readonly #isNative = inject(IS_NATIVE_PLATFORM);

  async requestPermission(): Promise<boolean> {
    const { display } = await this.#plugin.requestPermissions();
    return display === 'granted';
  }

  async cancel(source: FixedIdSource): Promise<void> {
    await this.cancelIds([NOTIFICATION_SOURCES[source].id]);
  }

  async cancelIds(ids: readonly number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.#plugin.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  }

  async scheduleDaily(reminder: DailyReminder): Promise<boolean> {
    if (!this.#isNative) return false;
    if (!(await this.requestPermission())) return false;
    await this.cancel(reminder.source);

    const copy = await firstValueFrom(
      this.#translate.get([reminder.titleKey, reminder.bodyKey])
    );

    await this.#plugin.schedule({
      notifications: [
        {
          id: NOTIFICATION_SOURCES[reminder.source].id,
          title: copy[reminder.titleKey],
          body: copy[reminder.bodyKey],
          extra: { source: reminder.source },
          schedule: {
            on: { hour: reminder.hour, minute: reminder.minute },
            allowWhileIdle: true,
          },
        },
      ],
    });
    return true;
  }

  async scheduleWeekly(reminder: WeeklyReminder): Promise<boolean> {
    if (!this.#isNative) return false;
    if (!(await this.requestPermission())) return false;

    const copy = await firstValueFrom(
      this.#translate.get(
        [reminder.titleKey, reminder.bodyKey],
        reminder.parameters
      )
    );

    await this.#plugin.schedule({
      notifications: [
        {
          id: reminder.id,
          title: copy[reminder.titleKey],
          body: copy[reminder.bodyKey],
          extra: { source: reminder.source },
          schedule: {
            on: {
              weekday: OS_WEEKDAY[reminder.isoWeekday],
              hour: reminder.hour,
              minute: reminder.minute,
            },
            allowWhileIdle: true,
          },
        },
      ],
    });
    return true;
  }

  async schedule(reminder: ScheduledReminder): Promise<void> {
    await this.#plugin.schedule({
      notifications: [
        {
          id: reminder.id,
          title: reminder.title,
          body: reminder.body,
          extra: { source: reminder.source },
          schedule: { at: reminder.at, allowWhileIdle: true },
        },
      ],
    });
  }

  async onTapped(
    handler: (source: NotificationSource | undefined) => void
  ): Promise<void> {
    await this.#plugin.addListener(
      'localNotificationActionPerformed',
      ({ notification }) => handler(asNotificationSource(notification.extra))
    );
  }
}
