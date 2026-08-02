import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { provideCategoryListFacade } from '../../@shared/util/categories/category-list.facade';
import { HouseholdCategoriesPageFacade, householdContext } from '../data';

export const householdRoutes: Routes = [
  {
    path: '',
    ...householdContext,
    children: [
      {
        path: 'list-settings',
        title: marker('page-title.household-list-settings'),
        loadComponent: () =>
          import('../feature/list-settings-page/list-settings.page').then(
            (m) => m.ListSettingsPage
          ),
      },
      {
        path: 'shopping/:listId',
        title: marker('page-title.household-shopping'),
        loadComponent: () =>
          import('../feature/shopping-page/shopping.page').then(
            (m) => m.ShoppingPage
          ),
      },
      {
        path: 'storage/:listId',
        title: marker('page-title.household-storage'),
        loadComponent: () =>
          import('../feature/storage-page/storage.page').then(
            (m) => m.StoragePage
          ),
      },
      {
        path: 'products/:listId',
        title: marker('page-title.household-products'),
        loadComponent: () =>
          import('../feature/products-page/products.page').then(
            (m) => m.ProductsPage
          ),
      },
      {
        path: 'categories/:listId',
        title: marker('page-title.categories'),
        providers: provideCategoryListFacade(HouseholdCategoriesPageFacade),
        loadComponent: () =>
          import('../../@shared/feature/categories/category-list-page/category-list.page').then(
            (m) => m.CategoryListPage
          ),
      },
    ],
  },
];

export const recipesRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.soykaf'),
    ...householdContext,
    loadComponent: () =>
      import('../feature/recipes-page/recipes.page').then((m) => m.RecipesPage),
  },
];
