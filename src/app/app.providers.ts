import { EnvironmentProviders, LOCALE_ID, Provider } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideGlobalErrorHandler } from './@shared/data/errors/global-error-handler';
import { bootLanguage, bootLocale } from './@shared/util/theme/language.boot';
import { provideDurableStorage } from './@shared/util/persistence/durable-storage';
import { provideSplashDeadline } from './@shared/data/services/splash.service';
import { commlinkContext } from './commlink/data';
import { notificationsContext } from './notifications/data';
import { provideNotificationRouting } from './notification-routing';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideState, provideStore } from '@ngrx/store';
import { categoryFilterRouteEffects } from './@shared/data/item-lists/category-filter.effects';
import { undoEffects } from './@shared/data/undo/undo.effects';
import { undoReducer } from './@shared/data/undo/undo.reducer';
import { UNDO_STATE_KEY } from './@shared/data/undo/undo.selector';

const kernelContexts = [commlinkContext, notificationsContext];

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
    provideState(UNDO_STATE_KEY, undoReducer),
    provideEffects(categoryFilterRouteEffects, undoEffects),
    ...kernelContexts.flatMap((context) => context.providers),
    provideDurableStorage(),
    provideSplashDeadline(),
    provideNotificationRouting(),
  ];
}
