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
        loadComponent: async () => {
          const { ModuleTabsPage } =
            await import('../../@shared/feature/module-tabs-page/module-tabs.page');
          return ModuleTabsPage;
        },
        children: [
          {
            path: 'timers',
            title: marker('page-title.tracking'),
            loadComponent: async () => {
              const { TrackingPage } =
                await import('../feature/tracking-page/tracking.page');
              return TrackingPage;
            },
          },
          {
            path: 'data',
            title: marker('page-title.data'),
            loadComponent: async () => {
              const { StatsPage } =
                await import('../feature/stats-page/stats.page');
              return StatsPage;
            },
          },
        ],
      },
    ],
  },
];
