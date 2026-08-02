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
