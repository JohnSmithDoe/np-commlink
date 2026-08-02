import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { officeTimeContext } from '../data';

export const officeTimeRoutes: Routes = [
  {
    path: '',
    ...officeTimeContext,
    children: [
      {
        path: '',
        title: marker('page-title.office-time'),
        loadComponent: () =>
          import('../feature/office-time-page/office-time.page').then(
            (m) => m.OfficeTimePage
          ),
      },
      {
        path: 'settings',
        title: marker('page-title.office-time-settings'),
        loadComponent: () =>
          import('../feature/office-time-settings-page/office-time-settings.page').then(
            (m) => m.OfficeTimeSettingsPage
          ),
      },
    ],
  },
];
