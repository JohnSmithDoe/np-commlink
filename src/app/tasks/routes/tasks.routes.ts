import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { provideCategoryListFacade } from '../../@shared/util/categories/category-list.facade';
import { TaskCategoriesPageFacade, tasksContext } from '../data';

/**
 * The `/tasks` subtree: the list and its catalog share one context spread on the
 * componentless root, so the slice registers and hydrates once for both. The list
 * leaf carries no `:listId` — tasks is a single-list domain, and a route param
 * nothing reads advertised a multi-list domain that does not exist (CR-066).
 * `TASKS_LIST_ID` stays purely as the `ItemDialogService` handshake token.
 *
 * The catalog route binds ONE facade to both tokens through
 * `provideCategoryListFacade`: `LIST_FACADE` drives the shared list shell,
 * `CATEGORY_LIST_FACADE` the three things a catalog row adds.
 */
export const tasksRoutes: Routes = [
  {
    path: '',
    ...tasksContext,
    children: [
      {
        path: 'categories',
        title: marker('page-title.categories'),
        providers: provideCategoryListFacade(TaskCategoriesPageFacade),
        loadComponent: () =>
          import('../../@shared/feature/categories/category-list-page/category-list.page').then(
            (m) => m.CategoryListPage
          ),
      },
      {
        path: 'list',
        title: marker('page-title.tasks'),
        loadComponent: () =>
          import('../feature/tasks-page/tasks.page').then((m) => m.TasksPage),
      },
    ],
  },
];
