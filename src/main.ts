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
import { provideStore, Store } from '@ngrx/store';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app/app.component';

import { routes } from './app/app.routes';
import { applicationActions } from './app/@shared/data/application.actions';
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
import { NotificationsEffects } from './app/notifications/data/notifications.effects';
import { NotificationsFromTrackingEffects } from './app/notifications/data/notifications-from-tracking.effects';
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

const storageConfig = {
  name: 'np-time-tracker',
  dbKey: 'npTimeTracker',
  description: 'np-time-tracker task to time spent management',
  storeName: 'npTimeTracker',
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
      settings: settingsReducer,
      tracking: trackingReducer,
      dialogs: dialogsReducer,
      officeTime: officeTimeReducer,
      notifications: notificationsReducer,
    }),
    provideEffects(
      AppEffects,
      AppMessageEffects,
      ItemListEffects,
      SettingsEffects,
      DialogsEffects,
      TrackingEffects,
      OfficeTimeEffects,
      NotificationsEffects,
      NotificationsFromTrackingEffects
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    {
      provide: LOCALE_ID,
      useValue: 'de-DE',
    },
    provideAppInitializer(() => {
      inject(Store).dispatch(applicationActions.load());
      void inject(NotificationService).init();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
