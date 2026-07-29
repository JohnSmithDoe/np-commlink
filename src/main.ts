import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  enableProdMode,
  importProvidersFrom,
  isDevMode,
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
import { AppComponent } from './app/app.component';

import { routes } from './app/app.routes';
import { provideAppKernel } from './app/app.providers';

import { environment } from './environments/environment';
import { AppTitleStrategy } from './app/app-title.strategy';

import { provideServiceWorker } from '@angular/service-worker';

if (environment.production) {
  enableProdMode();
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
    // The store root + every eager domain's state, effects and boot load: the
    // three slices needed before their own page is (dashboard read-model,
    // settings/theme, notifications inbox). Every routed context — tracking,
    // groceries, tasks, cash, trackplay, office-time, barcode — registers on its
    // route via its own <domain>/data/<domain>.providers.ts bundle and hydrates
    // via moduleHydrationResolver.
    provideAppKernel(),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
