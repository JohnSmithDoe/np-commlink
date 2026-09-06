/* ─── why ─────────────────────────────────────────────────────────
 * Two manifests in one file, which is the exception to one-per-domain.
 * `settings` merged into `commlink` because its page and `deck-config` do the
 * same job — configure the shell — and as one module they are each other's
 * tabs. `deck-config` therefore answers under `/settings/`, not `/commlink/`:
 * a tab is a segment below its module's shell, and the shell is settings'.
 *
 * `/commlink/deck` and a bare `/settings` stay as redirects. Both were
 * addressed directly — by `app.component.html`, by `deck.catalog` and by the
 * language e2e — and a move is no reason to break a bookmark.
 * ───────────────────────────────────────────────────────────────── */
import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const settingsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'general',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('../../@shared/feature/module-tabs-page/module-tabs.page').then(
        (m) => m.ModuleTabsPage
      ),
    children: [
      {
        path: 'general',
        title: marker('page-title.settings'),
        loadComponent: () =>
          import('../feature/settings-page/settings.page').then(
            (m) => m.SettingsPage
          ),
      },
      {
        path: 'deck',
        title: marker('page-title.deck-config'),
        loadComponent: () =>
          import('../feature/deck-config-page/deck-config.page').then(
            (m) => m.DeckConfigPage
          ),
      },
    ],
  },
];

export const commlinkRoutes: Routes = [
  {
    path: 'deck',
    redirectTo: '/settings/deck',
    pathMatch: 'full',
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
