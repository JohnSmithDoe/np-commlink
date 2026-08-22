import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const handbookRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.handbook'),
    loadComponent: () =>
      import('../feature/handbook-page/handbook.page').then(
        (m) => m.HandbookPage
      ),
  },
  {
    path: ':slug',
    title: marker('page-title.handbook-article'),
    loadComponent: () =>
      import('../feature/handbook-article-page/handbook-article.page').then(
        (m) => m.HandbookArticlePage
      ),
  },
];
