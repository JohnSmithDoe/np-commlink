import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { trackingContext } from '../data';

/**
 * The tracking context publishes two mount points because its stats page sits at
 * `/data` — a product URL that does not share the `/tracking` prefix
 * (route path ≠ folder). Both spread the same single-slice context.
 */
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
    // No `:listId`: the stats page reads its view from the slice and offers an
    // in-page switcher, so a path segment only ever advertised a choice the
    // route could not make.
    path: '',
    title: marker('page-title.data'),
    ...trackingContext,
    loadComponent: () =>
      import('../feature/stats-page/stats.page').then((m) => m.StatsPage),
  },
];
