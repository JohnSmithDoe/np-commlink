import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { provideCatalogFacade } from '../../@shared/util/categories/category-list.facade';
import {
  reopenDueTasksResolver,
  TaskCategoriesPageFacade,
  tasksContext,
} from '../data';

export const tasksRoutes: Routes = [
  {
    path: '',
    ...tasksContext,
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'categories',
        title: marker('page-title.categories'),
        providers: provideCatalogFacade(TaskCategoriesPageFacade),
        loadComponent: () =>
          import('../../@shared/feature/categories/category-list-page/category-list.page').then(
            (m) => m.CategoryListPage
          ),
      },
      {
        path: 'list',
        title: marker('page-title.tasks'),
        resolve: { reopened: reopenDueTasksResolver },
        loadComponent: () =>
          import('../feature/tasks-page/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'settings',
        title: marker('page-title.task-settings'),
        loadComponent: () =>
          import('../feature/task-settings-page/task-settings.page').then(
            (m) => m.TaskSettingsPage
          ),
      },
    ],
  },
];
