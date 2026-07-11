import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const routes: Routes = [
  {
    path: 'commlink',
    data: { title: marker('page-title.commlink') },
    loadComponent: () =>
      import('./commlink/feature/commlink-page/commlink.page').then(
        (m) => m.CommlinkPage
      ),
  },
  {
    path: 'tracking',
    data: { title: marker('page-title.tracking') },
    loadComponent: () =>
      import('./tracking/feature/tracking-page/tracking.page').then(
        (m) => m.TrackingPage
      ),
  },
  {
    path: 'data/:listId',
    data: { title: marker('page-title.data') },
    loadComponent: () =>
      import('./tracking/feature/stats-page/stats.page').then(
        (m) => m.StatsPage
      ),
  },
  {
    path: 'settings',
    data: { title: marker('page-title.settings') },
    loadComponent: () =>
      import('./office-time/feature/settings-page/settings.page').then(
        (m) => m.SettingsPage
      ),
  },
  {
    path: 'office-time',
    data: { title: marker('page-title.office-time') },
    loadComponent: () =>
      import('./office-time/feature/office-time-page/office-time-page.component').then(
        (m) => m.OfficeTimePage
      ),
  },
  {
    path: 'barcode',
    data: { title: marker('page-title.barcode') },
    loadComponent: () =>
      import('./barcode/feature/barcode.page').then((m) => m.BarcodePage),
  },
  {
    path: 'notifications',
    data: { title: marker('page-title.notifications') },
    loadComponent: () =>
      import('./notifications/feature/notifications.page').then(
        (m) => m.NotificationsPage
      ),
  },
  {
    // SOYKAF standby mount point — the seam for the np-kitchen-bot app.
    path: 'soykaf',
    data: { title: marker('page-title.soykaf') },
    loadComponent: () =>
      import('./kitchen/feature/kitchen-page/kitchen.page').then(
        (m) => m.KitchenPage
      ),
  },
  {
    path: '**',
    redirectTo: 'commlink',
    pathMatch: 'full',
  },
];
