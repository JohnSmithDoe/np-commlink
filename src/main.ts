import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  enableProdMode,
  importProvidersFrom,
  inject,
  isDevMode,
  LOCALE_ID,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  RouteReuseStrategy,
  TitleStrategy,
  withHashLocation,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { IonicStorageModule } from '@ionic/storage-angular';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStore, Store } from '@ngrx/store';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app/app.component';

import { routes } from './app/app.routes';
// Per-module load actions dispatched at boot for the eager kernel. `tracking`
// and `notifications` are NOT here — both are lazy and load via their route
// resolvers (§7). Only the always-on read-model + shared kernel slices load at
// boot; listSettings + quickadd moved into the lazy groceries domain.
// The dashboard READ-MODEL is owned by `commlink` (its only readers are the
// deck + the shell badge); only the telemetry contract the suppliers dispatch
// stays in @shared. Eager despite living in a domain folder — see commlink/data.
import {
  DashboardEffects,
  dashboardReducer,
  DashboardReadModelActions,
} from './app/commlink/data';
import { SettingsActions } from './app/@shared/data/settings/settings.actions';
import { settingsReducer } from './app/@shared/data/settings/settings.reducer';
import { SettingsEffects } from './app/@shared/data/settings/settings.effects';

import { environment } from './environments/environment';
import { AppTitleStrategy } from './app/app-title.strategy';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import { provideServiceWorker } from '@angular/service-worker';
import { NotificationService } from './app/notifications/util/notification.service';

// Set dayjs locale before bootstrap so any module-level dayjs() call
// (e.g. in reducers' initialState builders) sees the right locale.
// Mirrors LOCALE_ID below: dayjs ships locale packs under the short
// code ("de"), Angular wants the BCP-47 form ("de-DE").
dayjs.locale('de');

if (environment.production) {
  enableProdMode();
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const storageConfig = {
  name: 'np-commlink',
  dbKey: 'npCommlink',
  description: 'np-commlink unified datastore',
  storeName: 'npCommlink',
};

void bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes, withHashLocation()),
    provideIonicAngular({ animated: true, mode: 'md' }),
    importProvidersFrom(IonicStorageModule.forRoot(storageConfig)),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'de',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
    provideStore({
      router: routerReducer,
      // The eager kernel: the always-on cross-module read-model (dashboard, for
      // the deck + the notification badge) + shared-kernel library slices. NO
      // bounded-context domain slice is eager anymore — tracking, notifications,
      // groceries, tasks, cash, trackplay, office-time all register per-route
      // via provideState (see provide-*-lazy.ts) and hydrate via
      // moduleHydrationResolver (§7). notifications' off-route writers (tracking)
      // go through the durable NotificationsStore, not this store.
      dashboard: dashboardReducer,
      // App-global settings — the single persisted schema `version` anchor
      // (was a per-slice `version` on listSettings + office-time; both dropped).
      settings: settingsReducer,
    }),
    provideRouterStore(),
    provideEffects(
      // Eager persistence sink for the dashboard read-model (plan §3): loads
      // the persisted summaries at boot and mirrors every report to disk.
      DashboardEffects,
      // Settings owns theme: load own key at boot, apply <html data-theme>,
      // reveal the boot splash, and persist theme changes.
      SettingsEffects
      // Every bounded context registers its effects lazily on its route(s):
      // notifications (load/save/telemetry/debug) in notificationsLazyProviders;
      // tracking (load/save/search/telemetry/reconcile + item-list engine +
      // edit-dialog) in trackingLazyProviders; grocery + tasks engines/dialogs
      // in their lazy providers (§2b); cash/trackplay/office-time likewise.
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    {
      provide: LOCALE_ID,
      useValue: 'de-DE',
    },
    provideAppInitializer(() => {
      const store = inject(Store);
      // Boot loads ONLY the eager kernel: the shared-kernel listSettings and the
      // persisted dashboard read-model (so the deck + the always-on notification
      // badge show cold-launch numbers before any producing module loads, §3).
      // Every bounded context (tracking, notifications, groceries, …) loads via
      // its own route resolver, not here (§7).
      store.dispatch(SettingsActions.load());
      store.dispatch(DashboardReadModelActions.load());
      void inject(NotificationService).init();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
