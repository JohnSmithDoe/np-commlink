import { Routes } from '@angular/router';

/**
 * The composition root's URL table: each path names the domain that owns it and
 * nothing else. A domain's state, hydration resolvers, facade bindings and page
 * components are named inside its own `routes/<domain>.routes.ts`, which carries
 * `domain:<domain>` + `type:routes` — so Sheriff seals a domain's routing to that
 * domain, where the shell (tagged only `type:shell`) could reach anything.
 *
 * These `loadChildren` edges are also the only import from the shell into a
 * domain, which is what keeps eleven data layers out of the initial chunk: the
 * eager kernel (`provideAppKernel()`) is the sole eager composition site.
 *
 * Every path is a domain prefix, so there is no cross-domain ordering left to
 * arbitrate here — a domain orders its own pages inside its manifest. `**` stays
 * last. The two paths that don't read as their folder are deliberate: `/soykaf`
 * and `/data` are product surfaces (deck programs), not structure.
 */
export const routes: Routes = [
  {
    path: 'commlink',
    loadChildren: () =>
      import('./commlink/routes/commlink.routes').then((m) => m.commlinkRoutes),
  },
  {
    path: 'tracking',
    loadChildren: () =>
      import('./tracking/routes/tracking.routes').then((m) => m.trackingRoutes),
  },
  {
    path: 'data',
    loadChildren: () =>
      import('./tracking/routes/tracking.routes').then(
        (m) => m.trackingDataRoutes
      ),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./settings/routes/settings.routes').then((m) => m.settingsRoutes),
  },
  {
    path: 'office-time',
    loadChildren: () =>
      import('./office-time/routes/office-time.routes').then(
        (m) => m.officeTimeRoutes
      ),
  },
  {
    path: 'barcode',
    loadChildren: () =>
      import('./barcode/routes/barcode.routes').then((m) => m.barcodeRoutes),
  },
  {
    path: 'notifications',
    loadChildren: () =>
      import('./notifications/routes/notifications.routes').then(
        (m) => m.notificationsRoutes
      ),
  },
  {
    path: 'geist',
    loadChildren: () =>
      import('./geist/routes/geist.routes').then((m) => m.geistRoutes),
  },
  {
    path: 'soykaf',
    loadChildren: () =>
      import('./groceries/routes/groceries.routes').then(
        (m) => m.recipesRoutes
      ),
  },
  {
    path: 'groceries',
    loadChildren: () =>
      import('./groceries/routes/groceries.routes').then(
        (m) => m.groceriesRoutes
      ),
  },
  {
    path: 'tasks',
    loadChildren: () =>
      import('./tasks/routes/tasks.routes').then((m) => m.tasksRoutes),
  },
  {
    path: 'cash',
    loadChildren: () =>
      import('./cash/routes/cash.routes').then((m) => m.cashRoutes),
  },
  {
    path: 'trackplay',
    loadChildren: () =>
      import('./trackplay/routes/trackplay.routes').then(
        (m) => m.trackplayRoutes
      ),
  },
  {
    path: '**',
    redirectTo: 'commlink',
    pathMatch: 'full',
  },
];
