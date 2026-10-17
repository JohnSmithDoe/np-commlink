import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const coprocessorRoutes: Routes = [
  {
    path: '',
    redirectTo: 'calc',
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
        path: 'calc',
        title: marker('page-title.coprocessor-calc'),
        loadComponent: async () => {
          const { CoprocessorCalcPage } =
            await import('../feature/calc-page/calc.page');
          return CoprocessorCalcPage;
        },
      },
      {
        path: 'units',
        title: marker('page-title.coprocessor-units'),
        loadComponent: async () => {
          const { CoprocessorUnitsPage } =
            await import('../feature/units-page/units.page');
          return CoprocessorUnitsPage;
        },
      },
      {
        path: 'golden',
        title: marker('page-title.coprocessor-golden'),
        loadComponent: async () => {
          const { CoprocessorGoldenPage } =
            await import('../feature/golden-page/golden.page');
          return CoprocessorGoldenPage;
        },
      },
    ],
  },
];
