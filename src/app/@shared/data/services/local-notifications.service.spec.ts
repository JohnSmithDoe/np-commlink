import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { NOTIFICATION_SOURCES } from '../../model/notification-sources';
import {
  IS_NATIVE_PLATFORM,
  LOCAL_NOTIFICATIONS,
  LocalNotificationsService,
} from './local-notifications.service';

const daily = () => ({
  source: 'ritualReminder' as const,
  titleKey: 'ritual.reminder.title',
  bodyKey: 'ritual.reminder.body',
  hour: 18,
  minute: 30,
});

describe('LocalNotificationsService', () => {
  let service: LocalNotificationsService;
  let plugin: {
    requestPermissions: ReturnType<typeof vi.fn>;
    schedule: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    addListener: ReturnType<typeof vi.fn>;
  };

  const scheduled = () => plugin.schedule.mock.calls[0][0].notifications[0];

  const setup = (display = 'granted', isNative = true) => {
    plugin = {
      requestPermissions: vi.fn().mockResolvedValue({ display }),
      schedule: vi.fn().mockResolvedValue(undefined),
      cancel: vi.fn().mockResolvedValue(undefined),
      addListener: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCAL_NOTIFICATIONS, useValue: plugin },
        { provide: IS_NATIVE_PLATFORM, useValue: isNative },
        {
          provide: TranslateService,
          useValue: {
            get: (keys: string[]) =>
              of(Object.fromEntries(keys.map((key) => [key, `de:${key}`]))),
          },
        },
      ],
    });
    service = TestBed.inject(LocalNotificationsService);
  };

  it('schedules nothing, and says so, when the OS refuses permission', async () => {
    setup('denied');

    expect(await service.scheduleDaily(daily())).toBe(false);
    expect(plugin.schedule).not.toHaveBeenCalled();
    expect(plugin.cancel).not.toHaveBeenCalled();
  });

  it('refuses a daily reminder in the browser, where a cron fires once and lies', async () => {
    setup('granted', false);

    expect(await service.scheduleDaily(daily())).toBe(false);
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('still delivers a one-shot in the browser — `at` is what the web honours', async () => {
    setup('granted', false);
    const at = new Date('2026-07-20T18:00:00');

    await service.schedule({ id: 99, title: 'T', body: 'B', at });

    expect(scheduled().schedule).toEqual({ at, allowWhileIdle: true });
  });

  it('resolves the wording it was handed', async () => {
    setup();

    expect(await service.scheduleDaily(daily())).toBe(true);
    expect(scheduled()).toEqual(
      expect.objectContaining({
        title: 'de:ritual.reminder.title',
        body: 'de:ritual.reminder.body',
      })
    );
  });

  it('repeats on the cron branch, never on `at` — `every` is dead beside `at`', async () => {
    setup();

    await service.scheduleDaily(daily());

    expect(scheduled().schedule).toEqual({
      on: { hour: 18, minute: 30 },
      allowWhileIdle: true,
    });
  });

  it('leaves a one-shot notification a one-shot', async () => {
    setup();
    const at = new Date('2026-07-20T18:00:00');

    await service.schedule({ id: 99, title: 'T', body: 'B', at });

    expect(scheduled().schedule).toEqual({ at, allowWhileIdle: true });
  });

  it('takes the id from the source, so the two can never disagree', async () => {
    setup();

    await service.scheduleDaily(daily());

    expect(scheduled().id).toBe(NOTIFICATION_SOURCES.ritualReminder.id);
    expect(scheduled().extra).toEqual({ source: 'ritualReminder' });
    expect(plugin.cancel).toHaveBeenCalledWith({
      notifications: [{ id: NOTIFICATION_SOURCES.ritualReminder.id }],
    });
  });

  it('reports the tapped source back to whoever is routing', async () => {
    setup();
    const seen: unknown[] = [];

    await service.onTapped((source) => seen.push(source));
    const [, listener] = plugin.addListener.mock.calls[0];
    listener({ notification: { extra: { source: 'officeReminder' } } });

    expect(seen).toEqual(['officeReminder']);
  });

  it('hands over nothing for a source no build of this app still knows', async () => {
    setup();
    const seen: unknown[] = [];

    await service.onTapped((source) => seen.push(source));
    const [, listener] = plugin.addListener.mock.calls[0];
    listener({ notification: { extra: { source: 'retiredReminder' } } });
    listener({ notification: { extra: {} } });
    listener({ notification: {} });

    expect(seen).toEqual([undefined, undefined, undefined]);
  });
});
