import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ritualContext } from '../data';

export const ritualRoutes: Routes = [
  {
    path: '',
    ...ritualContext,
    children: [
      {
        path: '',
        title: marker('page-title.ritual'),
        loadComponent: () =>
          import('../feature/ritual-page/ritual.page').then(
            (m) => m.RitualPage
          ),
      },
      {
        path: 'settings',
        title: marker('page-title.ritual-settings'),
        loadComponent: () =>
          import('../feature/ritual-settings-page/ritual-settings.page').then(
            (m) => m.RitualSettingsPage
          ),
      },
    ],
  },
];
