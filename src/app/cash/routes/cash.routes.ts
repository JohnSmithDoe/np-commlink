import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { provideCatalogFacade } from '../../@shared/util/categories/category-list.facade';
import { CashCategoriesPageFacade, cashContext } from '../data';

export const cashRoutes: Routes = [
  {
    path: '',
    ...cashContext,
    children: [
      {
        path: '',
        title: marker('page-title.cash'),
        loadComponent: () =>
          import('../feature/cash-page/cash.page').then((m) => m.CashPage),
      },
      {
        path: 'rules',
        title: marker('page-title.cash-rules'),
        loadComponent: () =>
          import('../feature/cash-rules-page/cash-rules.page').then(
            (m) => m.CashRulesPage
          ),
      },
      {
        path: 'report',
        title: marker('page-title.cash-report'),
        loadComponent: () =>
          import('../feature/cash-report-page/cash-report.page').then(
            (m) => m.CashReportPage
          ),
      },
      {
        path: 'categories',
        title: marker('page-title.categories'),
        providers: provideCatalogFacade(CashCategoriesPageFacade),
        loadComponent: () =>
          import('../../@shared/feature/categories/category-list-page/category-list.page').then(
            (m) => m.CategoryListPage
          ),
      },
      {
        path: 'category/:categoryId',
        title: marker('page-title.categories'),
        loadComponent: () =>
          import('../feature/cash-category-page/cash-category.page').then(
            (m) => m.CashCategoryPage
          ),
      },
      {
        path: ':accountId',
        title: marker('page-title.cash'),
        loadComponent: () =>
          import('../feature/cash-account-page/cash-account.page').then(
            (m) => m.CashAccountPage
          ),
      },
    ],
  },
];
