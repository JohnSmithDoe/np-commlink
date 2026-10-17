import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const notificationsRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.notifications'),
    loadComponent: async () => {
      const { NotificationsPage } =
        await import('../feature/notifications-page/notifications.page');
      return NotificationsPage;
    },
  },
];
