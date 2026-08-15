/* ─── why ─────────────────────────────────────────────────────────
 * A reminder that opens on whatever screen you left is not a cue — it
 * hands back the navigation it existed to remove. The tap carries a
 * SOURCE rather than a URL because the OS may hold a pending notification
 * for months, and a route renamed meanwhile leaves a dead link nothing
 * can fix. The shell resolves it because it owns the router, and because
 * no domain's injector exists yet when this listener is installed.
 * ───────────────────────────────────────────────────────────────── */
import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { Router } from '@angular/router';
import { LocalNotificationsService } from './@shared/data/services/local-notifications.service';
import { NOTIFICATION_SOURCES } from './@shared/model/notification-sources';

export function provideNotificationRouting(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const router = inject(Router);
    const notifications = inject(LocalNotificationsService);
    void notifications
      .onTapped((source) => {
        const route = source && NOTIFICATION_SOURCES[source].route;
        if (route) void router.navigateByUrl(route);
      })
      .catch(() => {});
  });
}
