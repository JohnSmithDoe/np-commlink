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
        loadComponent: async () => {
          const { CategoryListPage } =
            await import('../../@shared/feature/categories/category-list-page/category-list.page');
          return CategoryListPage;
        },
      },
      {
        path: 'list',
        title: marker('page-title.tasks'),
        resolve: { reopened: reopenDueTasksResolver },
        loadComponent: async () => {
          const { TasksPage } =
            await import('../feature/tasks-page/tasks.page');
          return TasksPage;
        },
      },
      {
        path: 'settings',
        title: marker('page-title.task-settings'),
        loadComponent: async () => {
          const { TaskSettingsPage } =
            await import('../feature/task-settings-page/task-settings.page');
          return TaskSettingsPage;
        },
      },
    ],
  },
];
