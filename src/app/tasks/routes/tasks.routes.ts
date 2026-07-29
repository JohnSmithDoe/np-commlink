import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { CATEGORIES_FACADE } from '../../@shared/util/categories/categories-page.facade';
import { TasksCategoriesPageFacade, tasksContext } from '../data';

/**
 * The `/tasks` subtree: the list and its catalog share one context spread on the
 * componentless root, so the slice registers and hydrates once for both. The list
 * leaf carries no `:listId` — tasks is a single-list domain, and a route param
 * nothing reads advertised a multi-list domain that does not exist (CR-066).
 * `TASKS_LIST_ID` stays purely as the `ItemDialogService` handshake token.
 */
export const tasksRoutes: Routes = [
  {
    path: '',
    ...tasksContext,
    children: [
      {
        path: 'categories',
        data: { title: marker('page-title.categories') },
        providers: [
          {
            provide: CATEGORIES_FACADE,
            useExisting: TasksCategoriesPageFacade,
          },
        ],
        loadComponent: () =>
          import('../../@shared/feature/edit-categories-page/edit-categories.page').then(
            (m) => m.EditCategoriesPage
          ),
      },
      {
        path: 'list',
        data: { title: marker('page-title.tasks') },
        loadComponent: () =>
          import('../feature/tasks-page/tasks.page').then((m) => m.TasksPage),
      },
    ],
  },
];
