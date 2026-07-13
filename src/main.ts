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
import { ApplicationActions } from './app/@shared/data/application.actions';
import { dashboardReducer } from './app/@shared/data/dashboard/dashboard.reducer';
import { itemDialogsReducer } from './app/@shared/data/item-dialogs/item-dialogs.reducer';
import { listSettingsReducer } from './app/@shared/data/list-settings/list-settings.reducer';
import { ListSettingsEffects } from './app/@shared/data/list-settings/list-settings.effects';
import { quickAddReducer } from './app/@shared/data/quick-add/quick-add.reducer';
import { cashReducer } from './app/cash/data/cash.reducer';
import { GroceryListEffects } from './app/grocery-list.effects';
import { ItemDialogsEffects } from './app/item-dialogs.effects';
import { trackplayReducer } from './app/trackplay/data/trackplay.reducer';
import { TrackplayEffects } from './app/trackplay/data/trackplay.effects';
import { DialogsEffects } from './app/tracking/data/dialogs/dialogs.effects';

import { dialogsReducer } from './app/tracking/data/dialogs/dialogs.reducer';
import { SettingsEffects } from './app/office-time/data/settings/settings.effects';
import { settingsReducer } from './app/office-time/data/settings/settings.reducer';
import { trackingReducer } from './app/tracking/data/tracking.reducer';
import { environment } from './environments/environment';
import { TrackingEffects } from './app/tracking/data/tracking.effects';
import { officeTimeReducer } from './app/office-time/data/office-time/office-time.reducer';
import { OfficeTimeEffects } from './app/office-time/data/office-time/office-time.effects';
import { notificationsReducer } from './app/notifications/data/notifications.reducer';
import { NotificationsTelemetryEffects } from './app/notifications/data/notifications-telemetry.effects';
import { OfficeTimeTelemetryEffects } from './app/office-time/data/office-time/office-time-telemetry.effects';
import { TrackingNotificationsEffects } from './app/tracking/data/tracking-notifications.effects';
import { AppTitleStrategy } from './app/app-title.strategy';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import { provideServiceWorker } from '@angular/service-worker';
import { NotificationService } from './app/notifications/util/notification.service';
import { ItemListEffects } from './app/tracking/data/item-list.effects';
import { AppEffects } from './app/app.effects';
import { AppMessageEffects } from './app/app.message.effects';

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

// Unified datastore for the merged super-app. `provideIonicStorageAngular` isn't
// exported by the installed @ionic/storage-angular, so we keep the module form
// but retarget the DB name to `np-commlink` (key prefix unified to `npc-` in the
// DatabaseService — see step 24). Fresh install path; no migration from the old
// np-time-tracker / kitchen-bot databases (brand-new repo).
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
      dashboard: dashboardReducer,
      settings: settingsReducer,
      tracking: trackingReducer,
      dialogs: dialogsReducer,
      officeTime: officeTimeReducer,
      notifications: notificationsReducer,
      itemDialogs: itemDialogsReducer,
      listSettings: listSettingsReducer,
      quickadd: quickAddReducer,
      // groceries (products/shopping/storage) + tasks are lazy: their reducers
      // register per-route via provideState (see provide-groceries-lazy.ts /
      // provide-tasks-lazy.ts) and hydrate via datastoreHydrationResolver.
      cash: cashReducer,
      trackplay: trackplayReducer,
    }),
    provideRouterStore(),
    provideEffects(
      AppEffects,
      AppMessageEffects,
      ItemListEffects,
      ListSettingsEffects,
      SettingsEffects,
      DialogsEffects,
      TrackingEffects,
      OfficeTimeEffects,
      TrackingNotificationsEffects,
      NotificationsTelemetryEffects,
      OfficeTimeTelemetryEffects,
      // ProductsEffects/ShoppingEffects/StorageEffects and TasksEffects are
      // registered lazily on their routes (see provide-*-lazy.ts). The shell
      // orchestrators below stay eager: they only react to grocery/tasks
      // actions (dispatched exclusively while those routes are active) and read
      // the matching slice via withLatestFrom, so it is always present.
      GroceryListEffects,
      ItemDialogsEffects,
      TrackplayEffects
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    {
      provide: LOCALE_ID,
      useValue: 'de-DE',
    },
    provideAppInitializer(() => {
      inject(Store).dispatch(ApplicationActions.load());
      void inject(NotificationService).init();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
