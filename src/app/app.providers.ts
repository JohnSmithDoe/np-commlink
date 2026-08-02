import { EnvironmentProviders, LOCALE_ID, Provider } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideGlobalErrorHandler } from './@shared/util/errors/global-error-handler';
import {
  bootLanguage,
  bootLocale,
} from './@shared/util/theme/language.service';
import { provideDurableStorage } from './@shared/util/persistence/durable-storage';
import { provideSplashDeadline } from './@shared/util/services/splash.service';
import { commlinkContext } from './commlink/data';
import { notificationsContext } from './notifications/data';
import { settingsContext } from './settings/data';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';

const kernelContexts = [commlinkContext, settingsContext, notificationsContext];

export function provideAppKernel(): Array<Provider | EnvironmentProviders> {
  return [
    provideGlobalErrorHandler(),
    provideTranslateService({
      lang: bootLanguage(),
      fallbackLang: 'de',
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json',
      }),
    }),
    { provide: LOCALE_ID, useFactory: bootLocale },
    provideStore({ router: routerReducer }),
    provideRouterStore(),
    ...kernelContexts.flatMap((context) => context.providers),
    provideDurableStorage(),
    provideSplashDeadline(),
  ];
}
