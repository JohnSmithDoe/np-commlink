import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

/**
 * GEIST holds no NgRx state at all — the transcript is a component signal and
 * the session lives in the browser — so the domain has no `data/` layer and this
 * manifest has no context to spread.
 */
export const geistRoutes: Routes = [
  {
    path: '',
    data: { title: marker('page-title.geist') },
    loadComponent: () =>
      import('../feature/geist-page/geist.page').then((m) => m.GeistPage),
  },
];
