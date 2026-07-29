import { EnvironmentProviders, LOCALE_ID, Provider } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideGlobalErrorHandler } from './@shared/util/global-error-handler';
import { bootLanguage, bootLocale } from './@shared/util/language.service';
import { provideSplashDeadline } from './@shared/util/splash.service';
import { commlinkContext } from './commlink/data';
import { notificationsContext } from './notifications/data';
import { settingsContext } from './settings/data';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';

/**
 * The eager kernel: everything that must exist before the first route resolves.
 *
 * These are the same `<domain>Context` bundles a routed context hands to its
 * route's `providers` — spread here instead, which is the whole of what "eager"
 * means. Lifecycle is a property of the composition site, never of who names a
 * domain's reducers: no reducer, effect or action group is visible outside the
 * domain that owns it, and `main.ts` names none of them. Their `resolve` halves
 * are empty by construction (`hydrate: 'boot'`), so only `providers` is read.
 *
 * What earns a slice a place here is being needed before its own page is: the
 * dashboard read-model and the notifications inbox are both cross-module sinks
 * behind always-on shell chrome, and the theme in `settings` must apply under
 * the boot splash before first paint.
 *
 * Order matters — the store root must come first: `provideState` /
 * `provideEffects` register through environment initializers, which run in
 * provider order.
 *
 * The i18n root lives here rather than in `main.ts` for a boundary reason: both
 * the starting bundle and `LOCALE_ID` come from the persisted language, and the
 * function that reads it is `type:util`, which Sheriff lets the shell import and
 * the entry file not.
 */
const kernelContexts = [commlinkContext, settingsContext, notificationsContext];

export function provideAppKernel(): Array<Provider | EnvironmentProviders> {
  return [
    // First so that its `window` listeners are attached before the other
    // initializers in this array run — a throw in one of those is then reported
    // rather than lost. It cannot cover this array's own evaluation: every
    // element here is called before `bootstrapApplication` receives it, so a
    // throw from `bootLanguage()` below happens while there is no injector to
    // hold an `ErrorHandler` at all.
    provideGlobalErrorHandler(),
    // Both read the same boot mirror, so the first bundle fetched and the locale
    // every pipe formats in agree from the first frame — no German flash for an
    // English user, and no second fetch to correct one. `fallbackLang` stays
    // German: it is the language every key was written in.
    provideTranslateService({
      lang: bootLanguage(),
      fallbackLang: 'de',
      // `./i18n/` is relative to <base href>, not the server root: Codeberg
      // Pages serves the app from /np-commlink/, where an absolute '/i18n/'
      // would 404 and leave every label rendering as its raw key.
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json',
      }),
    }),
    { provide: LOCALE_ID, useFactory: bootLocale },
    provideStore({ router: routerReducer }),
    provideRouterStore(),
    ...kernelContexts.flatMap((context) => context.providers),
    provideSplashDeadline(),
  ];
}
