import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { provideCatalogFacade } from '../../@shared/util/categories/category-list.facade';
import { HouseholdCategoriesPageFacade, householdContext } from '../data';

export const householdRoutes: Routes = [
  {
    path: '',
    ...householdContext,
    children: [
      {
        path: '',
        redirectTo: 'shopping',
        pathMatch: 'full',
      },
      {
        path: 'list-settings',
        title: marker('page-title.household-list-settings'),
        loadComponent: async () => {
          const { ListSettingsPage } =
            await import('../feature/list-settings-page/list-settings.page');
          return ListSettingsPage;
        },
      },
      {
        path: 'categories/:listId',
        title: marker('page-title.categories'),
        providers: provideCatalogFacade(HouseholdCategoriesPageFacade),
        loadComponent: async () => {
          const { CategoryListPage } =
            await import('../../@shared/feature/categories/category-list-page/category-list.page');
          return CategoryListPage;
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
            path: 'soykaf',
            title: marker('page-title.soykaf'),
            loadComponent: async () => {
              const { RecipesPage } =
                await import('../feature/recipes-page/recipes.page');
              return RecipesPage;
            },
          },
          {
            path: 'shopping',
            title: marker('page-title.household-shopping'),
            data: { listId: '_shopping' },
            loadComponent: async () => {
              const { ShoppingPage } =
                await import('../feature/shopping-page/shopping.page');
              return ShoppingPage;
            },
          },
          {
            path: 'storage',
            title: marker('page-title.household-storage'),
            data: { listId: '_storage' },
            loadComponent: async () => {
              const { StoragePage } =
                await import('../feature/storage-page/storage.page');
              return StoragePage;
            },
          },
          {
            path: 'products',
            title: marker('page-title.household-products'),
            data: { listId: '_products' },
            loadComponent: async () => {
              const { ProductsPage } =
                await import('../feature/products-page/products.page');
              return ProductsPage;
            },
          },
        ],
      },
    ],
  },
];
