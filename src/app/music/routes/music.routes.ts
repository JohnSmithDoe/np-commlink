import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const musicRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.music'),
    loadComponent: () =>
      import('../feature/music-page/music.page').then((m) => m.MusicPage),
  },
];
