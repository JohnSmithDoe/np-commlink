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
    loadComponent: () =>
      import('../../@shared/feature/module-tabs-page/module-tabs.page').then(
        (m) => m.ModuleTabsPage
      ),
    children: [
      {
        path: 'calc',
        title: marker('page-title.coprocessor-calc'),
        loadComponent: () =>
          import('../feature/calc-page/calc.page').then(
            (m) => m.CoprocessorCalcPage
          ),
      },
      {
        path: 'units',
        title: marker('page-title.coprocessor-units'),
        loadComponent: () =>
          import('../feature/units-page/units.page').then(
            (m) => m.CoprocessorUnitsPage
          ),
      },
      {
        path: 'golden',
        title: marker('page-title.coprocessor-golden'),
        loadComponent: () =>
          import('../feature/golden-page/golden.page').then(
            (m) => m.CoprocessorGoldenPage
          ),
      },
    ],
  },
];
