import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const notificationsRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.notifications'),
    loadComponent: () =>
      import('../feature/notifications-page/notifications.page').then(
        (m) => m.NotificationsPage
      ),
  },
];
