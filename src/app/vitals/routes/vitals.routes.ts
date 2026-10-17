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
        redirectTo: 'profiles',
        pathMatch: 'full',
      },
      {
        path: '',
        loadComponent: async () => {
          const { ModuleTabsPage } =
            await import('../../@shared/feature/module-tabs-page/module-tabs.page');
          return ModuleTabsPage;
        },
        children: [
          {
            path: 'profiles',
            children: [
              {
                path: '',
                title: marker('page-title.vitals'),
                loadComponent: async () => {
                  const { VitalsProfilesPage } =
                    await import('../feature/profiles-page/profiles.page');
                  return VitalsProfilesPage;
                },
              },
              {
                path: ':id',
                title: marker('page-title.vitals-profile'),
                loadComponent: async () => {
                  const { VitalsProfilePage } =
                    await import('../feature/profile-page/profile.page');
                  return VitalsProfilePage;
                },
              },
              {
                path: ':id/pills',
                title: marker('page-title.vitals-pills'),
                loadComponent: async () => {
                  const { VitalsPillsPage } =
                    await import('../feature/pills-page/pills.page');
                  return VitalsPillsPage;
                },
              },
              {
                path: ':id/zodiac',
                title: marker('page-title.vitals-zodiac'),
                loadComponent: async () => {
                  const { VitalsZodiacPage } =
                    await import('../feature/zodiac-page/zodiac.page');
                  return VitalsZodiacPage;
                },
              },
              {
                path: ':id/iching',
                title: marker('page-title.vitals-iching'),
                loadComponent: async () => {
                  const { VitalsIChingPage } =
                    await import('../feature/iching-page/iching.page');
                  return VitalsIChingPage;
                },
              },
              {
                path: ':id/iching/cast',
                title: marker('page-title.vitals-iching-cast'),
                loadComponent: async () => {
                  const { VitalsIChingCastPage } =
                    await import('../feature/iching-cast-page/iching-cast.page');
                  return VitalsIChingCastPage;
                },
              },
            ],
          },
          {
            path: 'iching',
            children: [
              {
                path: '',
                title: marker('page-title.vitals-iching'),
                loadComponent: async () => {
                  const { VitalsIChingPage } =
                    await import('../feature/iching-page/iching.page');
                  return VitalsIChingPage;
                },
              },
              {
                path: 'cast',
                title: marker('page-title.vitals-iching-cast'),
                loadComponent: async () => {
                  const { VitalsIChingCastPage } =
                    await import('../feature/iching-cast-page/iching-cast.page');
                  return VitalsIChingCastPage;
                },
              },
            ],
          },
          {
            path: 'browse',
            children: [
              {
                path: '',
                title: marker('page-title.vitals-browse'),
                loadComponent: async () => {
                  const { VitalsBrowsePage } =
                    await import('../feature/browse-page/browse.page');
                  return VitalsBrowsePage;
                },
              },
              {
                path: 'zodiac',
                title: marker('page-title.vitals-browse-zodiac'),
                loadComponent: async () => {
                  const { VitalsBrowseZodiacPage } =
                    await import('../feature/browse-zodiac-page/browse-zodiac.page');
                  return VitalsBrowseZodiacPage;
                },
              },
              {
                path: 'zodiac/:sign',
                title: marker('page-title.vitals-browse-sign'),
                loadComponent: async () => {
                  const { VitalsBrowseSignPage } =
                    await import('../feature/browse-sign-page/browse-sign.page');
                  return VitalsBrowseSignPage;
                },
              },
              {
                path: 'chinese',
                title: marker('page-title.vitals-browse-chinese'),
                loadComponent: async () => {
                  const { VitalsBrowseChinesePage } =
                    await import('../feature/browse-chinese-page/browse-chinese.page');
                  return VitalsBrowseChinesePage;
                },
              },
              {
                path: 'chinese/:animal',
                title: marker('page-title.vitals-browse-animal'),
                loadComponent: async () => {
                  const { VitalsBrowseAnimalPage } =
                    await import('../feature/browse-animal-page/browse-animal.page');
                  return VitalsBrowseAnimalPage;
                },
              },
              {
                path: 'iching',
                title: marker('page-title.vitals-browse-iching'),
                loadComponent: async () => {
                  const { VitalsBrowseIChingPage } =
                    await import('../feature/browse-iching-page/browse-iching.page');
                  return VitalsBrowseIChingPage;
                },
              },
              {
                path: 'iching/:number',
                title: marker('page-title.vitals-browse-hexagram'),
                loadComponent: async () => {
                  const { VitalsBrowseHexagramPage } =
                    await import('../feature/browse-hexagram-page/browse-hexagram.page');
                  return VitalsBrowseHexagramPage;
                },
              },
              {
                path: 'ki',
                title: marker('page-title.vitals-browse-ki'),
                loadComponent: async () => {
                  const { VitalsBrowseKiPage } =
                    await import('../feature/browse-ki-page/browse-ki.page');
                  return VitalsBrowseKiPage;
                },
              },
              {
                path: 'life',
                title: marker('page-title.vitals-browse-life'),
                loadComponent: async () => {
                  const { VitalsBrowseLifePage } =
                    await import('../feature/browse-life-page/browse-life.page');
                  return VitalsBrowseLifePage;
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
