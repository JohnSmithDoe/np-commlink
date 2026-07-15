import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { moduleHydrationResolver } from './@shared/data/module-hydration.resolver';
import { GroceriesActions } from './groceries/data/groceries.actions';
import { groceriesLazyProviders } from './groceries/data/provide-groceries-lazy';
import { TasksActions } from './tasks/data/tasks.actions';
import { tasksLazyProviders } from './tasks/data/provide-tasks-lazy';
import { CashActions } from './cash/data/cash.actions';
import { cashLazyProviders } from './cash/data/provide-cash-lazy';
import { TrackplayActions } from './trackplay/data/trackplay.actions';
import { trackplayLazyProviders } from './trackplay/data/provide-trackplay-lazy';
import { SettingsActions } from './office-time/data/settings/settings.actions';
import { OfficeTimeActions } from './office-time/data/office-time/office-time.actions';
import { officeTimeLazyProviders } from './office-time/data/provide-office-time-lazy';

// Shared across the five `/trackplay/*` routes: they form one section over a
// single lazy slice, so each carries the same providers + hydration resolver
// (lazy-modules Phase D). One resolve object reference is safe — route config
// is read-only.
const trackplayResolve = {
  hydrated: moduleHydrationResolver(
    TrackplayActions.load,
    TrackplayActions.loaded
  ),
};

// Shared across the three routes that touch the office-time context
// (`/settings`, `/office-time`, `/barcode`). The context owns two slices, so
// two resolve keys hydrate them independently (lazy-modules Phase D).
const officeTimeResolve = {
  settings: moduleHydrationResolver(
    SettingsActions.load,
    SettingsActions.loaded
  ),
  officeTime: moduleHydrationResolver(
    OfficeTimeActions.load,
    OfficeTimeActions.loaded
  ),
};

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
    providers: officeTimeLazyProviders,
    resolve: officeTimeResolve,
    loadComponent: () =>
      import('./office-time/feature/settings-page/settings.page').then(
        (m) => m.SettingsPage
      ),
  },
  {
    path: 'office-time',
    data: { title: marker('page-title.office-time') },
    providers: officeTimeLazyProviders,
    resolve: officeTimeResolve,
    loadComponent: () =>
      import('./office-time/feature/office-time-page/office-time-page.component').then(
        (m) => m.OfficeTimePage
      ),
  },
  {
    path: 'barcode',
    data: { title: marker('page-title.barcode') },
    // The SIGIL badge lives in the office-time `officeTime` slice (the one
    // cross-domain bridge), so /barcode co-registers + hydrates office-time.
    providers: officeTimeLazyProviders,
    resolve: officeTimeResolve,
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
    providers: groceriesLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(
        GroceriesActions.load,
        GroceriesActions.loaded
      ),
    },
    loadComponent: () =>
      import('./groceries/feature/shopping-page/shopping.page').then(
        (m) => m.ShoppingPage
      ),
  },
  {
    path: 'storage/:listId',
    data: { title: marker('grocery.page-title.storage') },
    providers: groceriesLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(
        GroceriesActions.load,
        GroceriesActions.loaded
      ),
    },
    loadComponent: () =>
      import('./groceries/feature/storage-page/storage.page').then(
        (m) => m.StoragePage
      ),
  },
  {
    path: 'tasks/:listId',
    data: { title: marker('grocery.page-title.tasks') },
    providers: tasksLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(TasksActions.load, TasksActions.loaded),
    },
    loadComponent: () =>
      import('./tasks/feature/tasks-page/tasks.page').then((m) => m.TasksPage),
  },
  {
    path: 'products/:listId',
    data: { title: marker('grocery.page-title.products') },
    providers: groceriesLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(
        GroceriesActions.load,
        GroceriesActions.loaded
      ),
    },
    loadComponent: () =>
      import('./groceries/feature/products-page/products.page').then(
        (m) => m.ProductsPage
      ),
  },
  {
    path: 'list-settings',
    data: { title: marker('grocery.page-title.settings') },
    loadComponent: () =>
      import('./groceries/feature/list-settings-page/list-settings.page').then(
        (m) => m.ListSettingsPage
      ),
  },
  // Cash — offline multi-account finance ledger (purpose-built; no :listId).
  // `cash` is an eager slice, so these routes need no providers/resolver.
  {
    path: 'cash',
    data: { title: marker('cash.page-title.cash') },
    providers: cashLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(CashActions.load, CashActions.loaded),
    },
    loadComponent: () =>
      import('./cash/feature/cash-page/cash.page').then((m) => m.CashPage),
  },
  {
    // Static paths must precede `cash/:accountId` so they aren't captured as a param.
    path: 'cash/rules',
    data: { title: marker('cash.page-title.rules') },
    loadComponent: () =>
      import('./cash/feature/cash-rules-page/cash-rules.page').then(
        (m) => m.CashRulesPage
      ),
  },
  {
    path: 'cash/report',
    data: { title: marker('cash.page-title.report') },
    loadComponent: () =>
      import('./cash/feature/cash-report-page/cash-report.page').then(
        (m) => m.CashReportPage
      ),
  },
  {
    path: 'cash/:accountId',
    data: { title: marker('cash.page-title.cash') },
    loadComponent: () =>
      import('./cash/feature/cash-account-page/cash-account.page').then(
        (m) => m.CashAccountPage
      ),
  },
  // Trackplay (game-score tracker) — one sealed domain. `/trackplay` is the
  // program home (games list); the rest are its sub-pages.
  {
    path: 'trackplay',
    data: { title: marker('trackplay.page-title.games') },
    providers: trackplayLazyProviders,
    resolve: trackplayResolve,
    loadComponent: () =>
      import('./trackplay/feature/games-page/games.page').then(
        (m) => m.TrackplayGamesPage
      ),
  },
  {
    path: 'trackplay/players',
    data: { title: marker('trackplay.page-title.players') },
    providers: trackplayLazyProviders,
    resolve: trackplayResolve,
    loadComponent: () =>
      import('./trackplay/feature/players-page/players.page').then(
        (m) => m.TrackplayPlayersPage
      ),
  },
  {
    path: 'trackplay/player/:id',
    data: { title: marker('trackplay.page-title.player') },
    providers: trackplayLazyProviders,
    resolve: trackplayResolve,
    loadComponent: () =>
      import('./trackplay/feature/player-page/player.page').then(
        (m) => m.TrackplayPlayerPage
      ),
  },
  {
    path: 'trackplay/game-types',
    data: { title: marker('trackplay.page-title.game-types') },
    providers: trackplayLazyProviders,
    resolve: trackplayResolve,
    loadComponent: () =>
      import('./trackplay/feature/game-types-page/game-types.page').then(
        (m) => m.TrackplayGameTypesPage
      ),
  },
  {
    path: 'trackplay/game/:id',
    data: { title: marker('trackplay.page-title.game') },
    providers: trackplayLazyProviders,
    resolve: trackplayResolve,
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
