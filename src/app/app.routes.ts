import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { moduleHydrationResolver } from './@shared/data/module-hydration.resolver';
import { GroceriesActions, groceriesLazyProviders } from './groceries/data';
import { TasksActions, tasksLazyProviders } from './tasks/data';
import { CashActions, cashLazyProviders } from './cash/data';
import { TrackplayActions, trackplayLazyProviders } from './trackplay/data';
import {
  SettingsActions,
  OfficeTimeActions,
  officeTimeLazyProviders,
} from './office-time/data';
import { TrackingActions, trackingLazyProviders } from './tracking/data';
import { NotificationsActions } from './@shared/util/notifications/notifications.actions';
import { notificationsLazyProviders } from './notifications/data';
import { BarcodeActions, barcodeLazyProviders } from './barcode/data';

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

// Shared across the two routes that read `state.tracking` — `/tracking` (the
// tracker) and `/data/:listId` (the stats page). Both carry the tracking lazy
// providers + this resolver so tracking hydrates on entry (lazy-modules §7).
const trackingResolve = {
  hydrated: moduleHydrationResolver(
    TrackingActions.load,
    TrackingActions.loaded
  ),
};

// Shared across the two routes that touch the office-time context
// (`/settings`, `/office-time`). The context owns two slices, so two resolve
// keys hydrate them independently (lazy-modules Phase D).
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
    providers: trackingLazyProviders,
    resolve: trackingResolve,
    loadComponent: () =>
      import('./tracking/feature/tracking-page/tracking.page').then(
        (m) => m.TrackingPage
      ),
  },
  {
    path: 'data/:listId',
    data: { title: marker('page-title.data') },
    providers: trackingLazyProviders,
    resolve: trackingResolve,
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
    // The SIGIL badge is its own sealed lazy context now (sheriff-tighten §1) —
    // no longer a field inside office-time, so no cross-domain bridge.
    providers: barcodeLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(
        BarcodeActions.load,
        BarcodeActions.loaded
      ),
    },
    loadComponent: () =>
      import('./barcode/feature/barcode.page').then((m) => m.BarcodePage),
  },
  {
    path: 'notifications',
    data: { title: marker('page-title.notifications') },
    // notifications is lazy too (§7): its own list registers + hydrates here.
    // Off-route writers (tracking) go through the durable NotificationsStore.
    providers: notificationsLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(
        NotificationsActions.load,
        NotificationsActions.loaded
      ),
    },
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
  // `cash` is a lazy bounded context: every cash route registers the slice via
  // `cashLazyProviders` and hydrates through the module resolver — cash is torn
  // down on leaving the subtree, so each sibling route must re-register it.
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
    providers: cashLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(CashActions.load, CashActions.loaded),
    },
    loadComponent: () =>
      import('./cash/feature/cash-rules-page/cash-rules.page').then(
        (m) => m.CashRulesPage
      ),
  },
  {
    path: 'cash/report',
    data: { title: marker('cash.page-title.report') },
    providers: cashLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(CashActions.load, CashActions.loaded),
    },
    loadComponent: () =>
      import('./cash/feature/cash-report-page/cash-report.page').then(
        (m) => m.CashReportPage
      ),
  },
  {
    path: 'cash/:accountId',
    data: { title: marker('cash.page-title.cash') },
    providers: cashLazyProviders,
    resolve: {
      hydrated: moduleHydrationResolver(CashActions.load, CashActions.loaded),
    },
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
