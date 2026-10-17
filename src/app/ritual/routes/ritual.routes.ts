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
        loadComponent: async () => {
          const { RitualPage } =
            await import('../feature/ritual-page/ritual.page');
          return RitualPage;
        },
      },
      {
        path: 'settings',
        title: marker('page-title.ritual-settings'),
        loadComponent: async () => {
          const { RitualSettingsPage } =
            await import('../feature/ritual-settings-page/ritual-settings.page');
          return RitualSettingsPage;
        },
      },
    ],
  },
];
