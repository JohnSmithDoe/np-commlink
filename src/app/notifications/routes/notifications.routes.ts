import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

/**
 * A lazy page over an EAGER slice: the inbox is a fan-in sink every module
 * publishes into and the shell badge reads, so it registers in the kernel
 * (`notificationsContext`) and needs no context here — page laziness and slice
 * lifecycle are independent axes.
 */
export const notificationsRoutes: Routes = [
  {
    path: '',
    data: { title: marker('page-title.notifications') },
    loadComponent: () =>
      import('../feature/notifications-page/notifications.page').then(
        (m) => m.NotificationsPage
      ),
  },
];
