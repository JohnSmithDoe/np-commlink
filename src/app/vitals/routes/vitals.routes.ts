import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { vitalsContext } from '../data';

export const vitalsRoutes: Routes = [
  {
    path: '',
    ...vitalsContext,
    children: [
      {
        path: '',
        title: marker('page-title.vitals'),
        loadComponent: () =>
          import('../feature/profiles-page/profiles.page').then(
            (m) => m.VitalsProfilesPage
          ),
      },
      {
        path: 'profile/:id',
        title: marker('page-title.vitals-profile'),
        loadComponent: () =>
          import('../feature/profile-page/profile.page').then(
            (m) => m.VitalsProfilePage
          ),
      },
    ],
  },
];
