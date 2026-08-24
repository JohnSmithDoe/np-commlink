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
      {
        path: 'profile/:id/pills',
        title: marker('page-title.vitals-pills'),
        loadComponent: () =>
          import('../feature/pills-page/pills.page').then(
            (m) => m.VitalsPillsPage
          ),
      },
      {
        path: 'profile/:id/zodiac',
        title: marker('page-title.vitals-zodiac'),
        loadComponent: () =>
          import('../feature/zodiac-page/zodiac.page').then(
            (m) => m.VitalsZodiacPage
          ),
      },
      {
        path: 'profile/:id/iching',
        title: marker('page-title.vitals-iching'),
        loadComponent: () =>
          import('../feature/iching-page/iching.page').then(
            (m) => m.VitalsIChingPage
          ),
      },
      {
        path: 'profile/:id/iching/cast',
        title: marker('page-title.vitals-iching-cast'),
        loadComponent: () =>
          import('../feature/iching-cast-page/iching-cast.page').then(
            (m) => m.VitalsIChingCastPage
          ),
      },
    ],
  },
];
