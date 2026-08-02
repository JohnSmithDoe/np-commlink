import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const commlinkRoutes: Routes = [
  {
    path: 'deck',
    title: marker('page-title.deck-config'),
    loadComponent: () =>
      import('../feature/deck-config-page/deck-config.page').then(
        (m) => m.DeckConfigPage
      ),
  },
  {
    path: '',
    title: marker('page-title.commlink'),
    loadComponent: () =>
      import('../feature/commlink-page/commlink.page').then(
        (m) => m.CommlinkPage
      ),
  },
];
