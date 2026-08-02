import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const geistRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.geist'),
    loadComponent: () =>
      import('../feature/geist-page/geist.page').then((m) => m.GeistPage),
  },
];
