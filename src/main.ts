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
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app/shell/feature/app-root/app.component';

import { routes } from './app/shell/routes/app.routes';
import { provideAppKernel } from './app/shell/data/app.providers';

import { environment } from './environments/environment';
import { AppTitleStrategy } from './app/shell/data/app-title.strategy';

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
    provideIonicAngular({
      animated: true,
      mode: 'md',
      focusManagerPriority: ['heading', 'banner'],
    }),
    importProvidersFrom(IonicStorageModule.forRoot(storageConfig)),
    provideAppKernel(),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
