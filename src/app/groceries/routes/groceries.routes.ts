import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { CATEGORIES_FACADE } from '../../@shared/util/categories/categories-page.facade';
import { groceriesContext, GroceryCategoriesPageFacade } from '../data';

/**
 * The `/groceries` subtree. Every page here is a view on the ONE `groceries`
 * slice, so the context is spread once on a componentless root: entering the
 * subtree hydrates the grocery doc once, and moving between the lists, the
 * catalog and the flags page costs no further read.
 */
export const groceriesRoutes: Routes = [
  {
    path: '',
    ...groceriesContext,
    children: [
      {
        path: 'list-settings',
        data: { title: marker('page-title.groceries-list-settings') },
        loadComponent: () =>
          import('../feature/list-settings-page/list-settings.page').then(
            (m) => m.ListSettingsPage
          ),
      },
      {
        path: 'shopping/:listId',
        data: { title: marker('page-title.groceries-shopping') },
        loadComponent: () =>
          import('../feature/shopping-page/shopping.page').then(
            (m) => m.ShoppingPage
          ),
      },
      {
        path: 'storage/:listId',
        data: { title: marker('page-title.groceries-storage') },
        loadComponent: () =>
          import('../feature/storage-page/storage.page').then(
            (m) => m.StoragePage
          ),
      },
      {
        path: 'products/:listId',
        data: { title: marker('page-title.groceries-products') },
        loadComponent: () =>
          import('../feature/products-page/products.page').then(
            (m) => m.ProductsPage
          ),
      },
      {
        // The shared, domain-blind EditCategoriesPage, bound to this domain's
        // catalog by the route-level `CATEGORIES_FACADE`.
        path: 'categories/:listId',
        data: { title: marker('page-title.categories') },
        providers: [
          {
            provide: CATEGORIES_FACADE,
            useExisting: GroceryCategoriesPageFacade,
          },
        ],
        loadComponent: () =>
          import('../../@shared/feature/edit-categories-page/edit-categories.page').then(
            (m) => m.EditCategoriesPage
          ),
      },
    ],
  },
];

/**
 * SOYKAF — the recipe book. It keeps its own top-level URL because it is a deck
 * program in its own right (route path ≠ folder), but not its own context:
 * recipes are an aggregate of the grocery slice (the matcher joins them against
 * products + storage), so this route spreads the same bundle.
 */
export const recipesRoutes: Routes = [
  {
    path: '',
    data: { title: marker('page-title.soykaf') },
    ...groceriesContext,
    loadComponent: () =>
      import('../feature/recipes-page/recipes.page').then((m) => m.RecipesPage),
  },
];
