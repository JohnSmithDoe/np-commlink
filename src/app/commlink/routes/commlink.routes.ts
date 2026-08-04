/* ─── why ─────────────────────────────────────────────────────────
 * Two manifests in one file, which is the exception to one-per-domain.
 * `settings` merged into `commlink` because its page and `deck-config` do the
 * same job — configure the shell, a link this domain's own `deck.catalog`
 * already carried as `route: '/settings'`. The URL stays top-level rather than
 * nesting under `/commlink/`, because `app.component.html`, `deck.catalog` and
 * the language e2e all address `/settings` directly and a merge is no reason to
 * break a bookmark.
 * ───────────────────────────────────────────────────────────────── */
import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const settingsRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.settings'),
    loadComponent: () =>
      import('../feature/settings-page/settings.page').then(
        (m) => m.SettingsPage
      ),
  },
];

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
