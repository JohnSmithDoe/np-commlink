import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { provideCategoryListFacade } from '../../@shared/util/categories/category-list.facade';
import { CashCategoriesPageFacade, cashContext } from '../data';

/**
 * Cash — offline multi-account finance ledger (purpose-built; no `:listId`).
 *
 * The context sits on the componentless subtree root, so the slice registers once
 * and `[Cash] load` fires once per *subtree* entry instead of once per page:
 * navigating cash → cash/rules reuses the parent's resolved activation, because
 * the parent's params do not change. Its static paths must precede `:accountId`
 * so they aren't captured as a param.
 */
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
        // The catalog on the shared LIST page.
        path: 'categories',
        title: marker('page-title.categories'),
        providers: provideCategoryListFacade(CashCategoriesPageFacade),
        loadComponent: () =>
          import('../../@shared/feature/categories/category-list-page/category-list.page').then(
            (m) => m.CategoryListPage
          ),
      },
      {
        // Category→items drill: a category's transactions (cash's `?filter`
        // equivalent). Two segments, so it never collides with `:accountId`.
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
