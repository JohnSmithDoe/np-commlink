import { Routes } from '@angular/router';

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
      import('./commlink/routes/commlink.routes').then((m) => m.settingsRoutes),
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
      import('./household/routes/household.routes').then(
        (m) => m.recipesRoutes
      ),
  },
  {
    path: 'household',
    loadChildren: () =>
      import('./household/routes/household.routes').then(
        (m) => m.householdRoutes
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
