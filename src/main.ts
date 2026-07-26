import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  enableProdMode,
  importProvidersFrom,
  isDevMode,
  LOCALE_ID,
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
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app/app.component';

import { routes } from './app/app.routes';
import { provideAppKernel } from './app/app.providers';

import { environment } from './environments/environment';
import { AppTitleStrategy } from './app/app-title.strategy';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import { provideServiceWorker } from '@angular/service-worker';

// Set dayjs locale before bootstrap so any module-level dayjs() call
// (e.g. in reducers' initialState builders) sees the right locale.
// Mirrors LOCALE_ID below: dayjs ships locale packs under the short
// code ("de"), Angular wants the BCP-47 form ("de-DE").
dayjs.locale('de');

if (environment.production) {
  enableProdMode();
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '/i18n/', '.json');
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
    // The store root + every eager domain's state, effects and boot load: the
    // three slices needed before their own page is (dashboard read-model,
    // settings/theme, notifications inbox). Every routed context — tracking,
    // groceries, tasks, cash, trackplay, office-time, barcode — registers on its
    // route via provideState (see provide-*-lazy.ts) and hydrates via
    // moduleHydrationResolver.
    provideAppKernel(),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    {
      provide: LOCALE_ID,
      useValue: 'de-DE',
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
