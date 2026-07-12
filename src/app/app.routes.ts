import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const routes: Routes = [
  {
    path: 'commlink',
    data: { title: marker('page-title.commlink') },
    loadComponent: () =>
      import('./commlink/feature/commlink-page/commlink.page').then(
        (m) => m.CommlinkPage
      ),
  },
  {
    path: 'tracking',
    data: { title: marker('page-title.tracking') },
    loadComponent: () =>
      import('./tracking/feature/tracking-page/tracking.page').then(
        (m) => m.TrackingPage
      ),
  },
  {
    path: 'data/:listId',
    data: { title: marker('page-title.data') },
    loadComponent: () =>
      import('./tracking/feature/stats-page/stats.page').then(
        (m) => m.StatsPage
      ),
  },
  {
    path: 'settings',
    data: { title: marker('page-title.settings') },
    loadComponent: () =>
      import('./office-time/feature/settings-page/settings.page').then(
        (m) => m.SettingsPage
      ),
  },
  {
    path: 'office-time',
    data: { title: marker('page-title.office-time') },
    loadComponent: () =>
      import('./office-time/feature/office-time-page/office-time-page.component').then(
        (m) => m.OfficeTimePage
      ),
  },
  {
    path: 'barcode',
    data: { title: marker('page-title.barcode') },
    loadComponent: () =>
      import('./barcode/feature/barcode.page').then((m) => m.BarcodePage),
  },
  {
    path: 'notifications',
    data: { title: marker('page-title.notifications') },
    loadComponent: () =>
      import('./notifications/feature/notifications.page').then(
        (m) => m.NotificationsPage
      ),
  },
  {
    // SOYKAF standby mount point — the seam for the np-kitchen-bot app.
    path: 'soykaf',
    data: { title: marker('page-title.soykaf') },
    loadComponent: () =>
      import('./kitchen/feature/kitchen-page/kitchen.page').then(
        (m) => m.KitchenPage
      ),
  },
  // Grocery features (from np-kitchen-bot) — each an independent top-level
  // domain; the active list is derived from the :listId route param.
  {
    path: 'shopping/:listId',
    data: { title: marker('grocery.page-title.shopping') },
    loadComponent: () =>
      import('./shopping/feature/shopping-page/shopping.page').then(
        (m) => m.ShoppingPage
      ),
  },
  {
    path: 'storage/:listId',
    data: { title: marker('grocery.page-title.storage') },
    loadComponent: () =>
      import('./storage/feature/storage-page/storage.page').then(
        (m) => m.StoragePage
      ),
  },
  {
    path: 'tasks/:listId',
    data: { title: marker('grocery.page-title.tasks') },
    loadComponent: () =>
      import('./tasks/feature/tasks-page/tasks.page').then((m) => m.TasksPage),
  },
  {
    path: 'database/:listId',
    data: { title: marker('grocery.page-title.globals') },
    loadComponent: () =>
      import('./globals/feature/globals-page/globals.page').then(
        (m) => m.GlobalsPage
      ),
  },
  {
    path: 'list-settings',
    data: { title: marker('grocery.page-title.settings') },
    loadComponent: () =>
      import('./list-settings/feature/list-settings-page/list-settings.page').then(
        (m) => m.ListSettingsPage
      ),
  },
  // Cash — offline multi-account finance ledger (purpose-built; no :listId).
  {
    path: 'cash',
    data: { title: marker('cash.page-title.cash') },
    loadComponent: () =>
      import('./cash/feature/cash-page/cash.page').then((m) => m.CashPage),
  },
  // Trackplay (game-score tracker) — one sealed domain. `/trackplay` is the
  // program home (games list); the rest are its sub-pages.
  {
    path: 'trackplay',
    data: { title: marker('trackplay.page-title.games') },
    loadComponent: () =>
      import('./trackplay/feature/games-page/games.page').then(
        (m) => m.TrackplayGamesPage
      ),
  },
  {
    path: 'trackplay/players',
    data: { title: marker('trackplay.page-title.players') },
    loadComponent: () =>
      import('./trackplay/feature/players-page/players.page').then(
        (m) => m.TrackplayPlayersPage
      ),
  },
  {
    path: 'trackplay/player/:id',
    data: { title: marker('trackplay.page-title.player') },
    loadComponent: () =>
      import('./trackplay/feature/player-page/player.page').then(
        (m) => m.TrackplayPlayerPage
      ),
  },
  {
    path: 'trackplay/game-types',
    data: { title: marker('trackplay.page-title.game-types') },
    loadComponent: () =>
      import('./trackplay/feature/game-types-page/game-types.page').then(
        (m) => m.TrackplayGameTypesPage
      ),
  },
  {
    path: 'trackplay/game/:id',
    data: { title: marker('trackplay.page-title.game') },
    loadComponent: () =>
      import('./trackplay/feature/game-play-page/game-play.page').then(
        (m) => m.TrackplayGamePlayPage
      ),
  },
  {
    path: '**',
    redirectTo: 'commlink',
    pathMatch: 'full',
  },
];
