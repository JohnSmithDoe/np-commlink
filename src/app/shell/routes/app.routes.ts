import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'commlink',
    loadChildren: async () => {
      const { commlinkRoutes } =
        await import('../../commlink/routes/commlink.routes');
      return commlinkRoutes;
    },
  },
  {
    path: 'tracking',
    loadChildren: async () => {
      const { trackingRoutes } =
        await import('../../tracking/routes/tracking.routes');
      return trackingRoutes;
    },
  },
  {
    path: 'data',
    redirectTo: 'tracking/data',
    pathMatch: 'full',
  },
  {
    path: 'settings',
    loadChildren: async () => {
      const { settingsRoutes } =
        await import('../../commlink/routes/commlink.routes');
      return settingsRoutes;
    },
  },
  {
    path: 'office-time',
    loadChildren: async () => {
      const { officeTimeRoutes } =
        await import('../../office-time/routes/office-time.routes');
      return officeTimeRoutes;
    },
  },
  {
    path: 'notes',
    loadChildren: async () => {
      const { notesRoutes } = await import('../../notes/routes/notes.routes');
      return notesRoutes;
    },
  },
  {
    path: 'notifications',
    loadChildren: async () => {
      const { notificationsRoutes } =
        await import('../../notifications/routes/notifications.routes');
      return notificationsRoutes;
    },
  },
  {
    path: 'handbook',
    loadChildren: async () => {
      const { handbookRoutes } =
        await import('../../handbook/routes/handbook.routes');
      return handbookRoutes;
    },
  },
  {
    path: 'coprocessor',
    loadChildren: async () => {
      const { coprocessorRoutes } =
        await import('../../coprocessor/routes/coprocessor.routes');
      return coprocessorRoutes;
    },
  },
  {
    path: 'geist',
    loadChildren: async () => {
      const { geistRoutes } = await import('../../geist/routes/geist.routes');
      return geistRoutes;
    },
  },
  {
    path: 'soykaf',
    redirectTo: 'household/soykaf',
    pathMatch: 'full',
  },
  {
    path: 'household',
    loadChildren: async () => {
      const { householdRoutes } =
        await import('../../household/routes/household.routes');
      return householdRoutes;
    },
  },
  {
    path: 'tasks',
    loadChildren: async () => {
      const { tasksRoutes } = await import('../../tasks/routes/tasks.routes');
      return tasksRoutes;
    },
  },
  {
    path: 'ritual',
    loadChildren: async () => {
      const { ritualRoutes } =
        await import('../../ritual/routes/ritual.routes');
      return ritualRoutes;
    },
  },
  {
    path: 'cash',
    loadChildren: async () => {
      const { cashRoutes } = await import('../../cash/routes/cash.routes');
      return cashRoutes;
    },
  },
  {
    path: 'people',
    loadChildren: async () => {
      const { peopleRoutes } =
        await import('../../people/routes/people.routes');
      return peopleRoutes;
    },
  },
  {
    path: 'vitals',
    loadChildren: async () => {
      const { vitalsRoutes } =
        await import('../../vitals/routes/vitals.routes');
      return vitalsRoutes;
    },
  },
  {
    path: 'trackplay',
    loadChildren: async () => {
      const { trackplayRoutes } =
        await import('../../trackplay/routes/trackplay.routes');
      return trackplayRoutes;
    },
  },
  {
    path: 'music',
    loadChildren: async () => {
      const { musicRoutes } = await import('../../music/routes/music.routes');
      return musicRoutes;
    },
  },
  {
    path: '**',
    redirectTo: 'commlink',
    pathMatch: 'full',
  },
];
