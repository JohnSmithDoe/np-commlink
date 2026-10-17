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
        loadComponent: async () => {
          const { OfficeTimePage } =
            await import('../feature/office-time-page/office-time.page');
          return OfficeTimePage;
        },
      },
      {
        path: 'settings',
        title: marker('page-title.office-time-settings'),
        loadComponent: async () => {
          const { OfficeTimeSettingsPage } =
            await import('../feature/office-time-settings-page/office-time-settings.page');
          return OfficeTimeSettingsPage;
        },
      },
    ],
  },
];
