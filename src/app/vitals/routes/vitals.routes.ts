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
        path: 'iching',
        title: marker('page-title.vitals-iching'),
        loadComponent: () =>
          import('../feature/iching-page/iching.page').then(
            (m) => m.VitalsIChingPage
          ),
      },
      {
        path: 'iching/cast',
        title: marker('page-title.vitals-iching-cast'),
        loadComponent: () =>
          import('../feature/iching-cast-page/iching-cast.page').then(
            (m) => m.VitalsIChingCastPage
          ),
      },
      {
        path: 'browse',
        title: marker('page-title.vitals-browse'),
        loadComponent: () =>
          import('../feature/browse-page/browse.page').then(
            (m) => m.VitalsBrowsePage
          ),
      },
      {
        path: 'browse/zodiac',
        title: marker('page-title.vitals-browse-zodiac'),
        loadComponent: () =>
          import('../feature/browse-zodiac-page/browse-zodiac.page').then(
            (m) => m.VitalsBrowseZodiacPage
          ),
      },
      {
        path: 'browse/zodiac/:sign',
        title: marker('page-title.vitals-browse-sign'),
        loadComponent: () =>
          import('../feature/browse-sign-page/browse-sign.page').then(
            (m) => m.VitalsBrowseSignPage
          ),
      },
      {
        path: 'browse/iching',
        title: marker('page-title.vitals-browse-iching'),
        loadComponent: () =>
          import('../feature/browse-iching-page/browse-iching.page').then(
            (m) => m.VitalsBrowseIChingPage
          ),
      },
      {
        path: 'browse/iching/:number',
        title: marker('page-title.vitals-browse-hexagram'),
        loadComponent: () =>
          import('../feature/browse-hexagram-page/browse-hexagram.page').then(
            (m) => m.VitalsBrowseHexagramPage
          ),
      },
      {
        path: 'browse/ki',
        title: marker('page-title.vitals-browse-ki'),
        loadComponent: () =>
          import('../feature/browse-ki-page/browse-ki.page').then(
            (m) => m.VitalsBrowseKiPage
          ),
      },
      {
        path: 'browse/life',
        title: marker('page-title.vitals-browse-life'),
        loadComponent: () =>
          import('../feature/browse-life-page/browse-life.page').then(
            (m) => m.VitalsBrowseLifePage
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
