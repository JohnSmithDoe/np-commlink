import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { CATEGORIES_FACADE } from '../../@shared/util/categories/categories-page.facade';
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
        data: { title: marker('page-title.cash') },
        loadComponent: () =>
          import('../feature/cash-page/cash.page').then((m) => m.CashPage),
      },
      {
        path: 'rules',
        data: { title: marker('page-title.cash-rules') },
        loadComponent: () =>
          import('../feature/cash-rules-page/cash-rules.page').then(
            (m) => m.CashRulesPage
          ),
      },
      {
        path: 'report',
        data: { title: marker('page-title.cash-report') },
        loadComponent: () =>
          import('../feature/cash-report-page/cash-report.page').then(
            (m) => m.CashReportPage
          ),
      },
      {
        // Cash reuses the shared manage-categories page (replaces the rules
        // page's old inline palette).
        path: 'categories',
        data: { title: marker('page-title.categories') },
        providers: [
          { provide: CATEGORIES_FACADE, useExisting: CashCategoriesPageFacade },
        ],
        loadComponent: () =>
          import('../../@shared/feature/edit-categories-page/edit-categories.page').then(
            (m) => m.EditCategoriesPage
          ),
      },
      {
        // Category→items drill: a category's transactions (cash's `?filter`
        // equivalent). Two segments, so it never collides with `:accountId`.
        path: 'category/:categoryId',
        data: { title: marker('page-title.categories') },
        loadComponent: () =>
          import('../feature/cash-category-page/cash-category.page').then(
            (m) => m.CashCategoryPage
          ),
      },
      {
        path: ':accountId',
        data: { title: marker('page-title.cash') },
        loadComponent: () =>
          import('../feature/cash-account-page/cash-account.page').then(
            (m) => m.CashAccountPage
          ),
      },
    ],
  },
];
