import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { trackingContext } from '../data';

export const trackingRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.tracking'),
    ...trackingContext,
    loadComponent: () =>
      import('../feature/tracking-page/tracking.page').then(
        (m) => m.TrackingPage
      ),
  },
];

export const trackingDataRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.data'),
    ...trackingContext,
    loadComponent: () =>
      import('../feature/stats-page/stats.page').then((m) => m.StatsPage),
  },
];
