import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const handbookRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.handbook'),
    loadComponent: async () => {
      const { HandbookPage } =
        await import('../feature/handbook-page/handbook.page');
      return HandbookPage;
    },
  },
  {
    path: ':slug',
    title: marker('page-title.handbook-article'),
    loadComponent: async () => {
      const { HandbookArticlePage } =
        await import('../feature/handbook-article-page/handbook-article.page');
      return HandbookArticlePage;
    },
  },
];
