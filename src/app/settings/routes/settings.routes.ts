import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

/**
 * App-global settings (theme). The slice is an eager kernel one — the theme must
 * apply under the boot splash before first paint — so this is a lazy page over
 * already-hydrated state: no context.
 */
export const settingsRoutes: Routes = [
  {
    path: '',
    data: { title: marker('page-title.settings') },
    loadComponent: () =>
      import('../feature/settings-page/settings.page').then(
        (m) => m.SettingsPage
      ),
  },
];
