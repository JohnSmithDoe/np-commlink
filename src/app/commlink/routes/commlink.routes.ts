import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

/**
 * Both of commlink's slices are eager kernel ones (`commlinkContext`, composed
 * by `provideAppKernel()`), so these routes carry no context: by the time either
 * page can be reached the summary and the deck config are already hydrated.
 *
 * `deck` is the config surface, linked from `/settings` rather than mounted
 * under it — `settings → commlink` is a domain violation, so the page that
 * edits the deck lives under the deck's own prefix.
 */
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
