import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { provideCatalogFacade } from '../../@shared/util/categories/category-list.facade';
import { CashCategoriesPageFacade, cashContext } from '../data';

export const cashRoutes: Routes = [
  {
    path: '',
    ...cashContext,
    loadComponent: async () => {
      const { CashShellComponent } =
        await import('../feature/cash-shell/cash-shell.component');
      return CashShellComponent;
    },
    children: [
      {
        path: '',
        redirectTo: 'accounts',
        pathMatch: 'full',
      },
      {
        path: 'rules',
        title: marker('page-title.cash-rules'),
        loadComponent: async () => {
          const { CashRulesPage } =
            await import('../feature/cash-rules-page/cash-rules.page');
          return CashRulesPage;
        },
      },
      {
        path: 'report',
        title: marker('page-title.cash-report'),
        loadComponent: async () => {
          const { CashReportPage } =
            await import('../feature/cash-report-page/cash-report.page');
          return CashReportPage;
        },
      },
      {
        path: 'schedules',
        title: marker('page-title.cash-schedules'),
        loadComponent: async () => {
          const { CashSchedulesPage } =
            await import('../feature/cash-schedules-page/cash-schedules.page');
          return CashSchedulesPage;
        },
      },
      {
        path: 'uncategorized',
        title: marker('page-title.cash-uncategorized'),
        loadComponent: async () => {
          const { CashUncategorizedPage } =
            await import('../feature/cash-uncategorized-page/cash-uncategorized.page');
          return CashUncategorizedPage;
        },
      },
      {
        path: 'categories',
        title: marker('page-title.categories'),
        providers: provideCatalogFacade(CashCategoriesPageFacade),
        loadComponent: async () => {
          const { CategoryListPage } =
            await import('../../@shared/feature/categories/category-list-page/category-list.page');
          return CategoryListPage;
        },
      },
      {
        path: 'category/:categoryId',
        title: marker('page-title.categories'),
        loadComponent: async () => {
          const { CashCategoryPage } =
            await import('../feature/cash-category-page/cash-category.page');
          return CashCategoryPage;
        },
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
            path: 'accounts',
            children: [
              {
                path: '',
                title: marker('page-title.cash'),
                loadComponent: async () => {
                  const { CashPage } =
                    await import('../feature/cash-page/cash.page');
                  return CashPage;
                },
              },
              {
                path: ':accountId',
                title: marker('page-title.cash'),
                loadComponent: async () => {
                  const { CashAccountPage } =
                    await import('../feature/cash-account-page/cash-account.page');
                  return CashAccountPage;
                },
              },
            ],
          },
          {
            path: 'burndown',
            title: marker('page-title.cash-burndown'),
            loadComponent: async () => {
              const { CashBurndownPage } =
                await import('../feature/cash-burndown-page/cash-burndown.page');
              return CashBurndownPage;
            },
          },
          {
            path: 'spending',
            title: marker('page-title.cash-spending'),
            loadComponent: async () => {
              const { CashSpendingPage } =
                await import('../feature/cash-spending-page/cash-spending.page');
              return CashSpendingPage;
            },
          },
        ],
      },
    ],
  },
];
