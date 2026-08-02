import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { provideCategoryListFacade } from '../../@shared/util/categories/category-list.facade';
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
          import('../feature/pages/cash-page/cash.page').then(
            (m) => m.CashPage
          ),
      },
      {
        path: 'rules',
        title: marker('page-title.cash-rules'),
        loadComponent: () =>
          import('../feature/pages/cash-rules-page/cash-rules.page').then(
            (m) => m.CashRulesPage
          ),
      },
      {
        path: 'report',
        title: marker('page-title.cash-report'),
        loadComponent: () =>
          import('../feature/pages/cash-report-page/cash-report.page').then(
            (m) => m.CashReportPage
          ),
      },
      {
        path: 'categories',
        title: marker('page-title.categories'),
        providers: provideCategoryListFacade(CashCategoriesPageFacade),
        loadComponent: () =>
          import('../../@shared/feature/categories/category-list-page/category-list.page').then(
            (m) => m.CategoryListPage
          ),
      },
      {
        path: 'category/:categoryId',
        title: marker('page-title.categories'),
        loadComponent: () =>
          import('../feature/pages/cash-category-page/cash-category.page').then(
            (m) => m.CashCategoryPage
          ),
      },
      {
        path: ':accountId',
        title: marker('page-title.cash'),
        loadComponent: () =>
          import('../feature/pages/cash-account-page/cash-account.page').then(
            (m) => m.CashAccountPage
          ),
      },
    ],
  },
];
