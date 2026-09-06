import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { trackingContext } from '../data';

export const trackingRoutes: Routes = [
  {
    path: '',
    ...trackingContext,
    children: [
      {
        path: '',
        redirectTo: 'timers',
        pathMatch: 'full',
      },
      {
        path: '',
        loadComponent: () =>
          import('../../@shared/feature/module-tabs-page/module-tabs.page').then(
            (m) => m.ModuleTabsPage
          ),
        children: [
          {
            path: 'timers',
            title: marker('page-title.tracking'),
            loadComponent: () =>
              import('../feature/tracking-page/tracking.page').then(
                (m) => m.TrackingPage
              ),
          },
          {
            path: 'data',
            title: marker('page-title.data'),
            loadComponent: () =>
              import('../feature/stats-page/stats.page').then(
                (m) => m.StatsPage
              ),
          },
        ],
      },
    ],
  },
];
