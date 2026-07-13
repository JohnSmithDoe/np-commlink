import { provideHttpClient } from '@angular/common/http';
import {
  EnvironmentProviders,
  importProvidersFrom,
  Provider,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { IonicStorageModule } from '@ionic/storage-angular';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { IAppState } from '../types';
import { mockAppState } from './test-data';

type TestProvider = Provider | EnvironmentProviders;

/**
 * Base providers (everything except the store) needed to instantiate the
 * app's standalone components and services under test: zoneless change
 * detection, HttpClient (translate loader), Ionic config, Ionic Storage,
 * TranslateService and a no-op router.
 */
export const BASE_TEST_PROVIDERS: TestProvider[] = [
  provideZonelessChangeDetection(),
  provideHttpClient(),
  provideIonicAngular(),
  provideRouter([]),
  importProvidersFrom(TranslateModule.forRoot()),
  importProvidersFrom(IonicStorageModule.forRoot()),
];

/**
 * Build the provider array for a component/service spec. Includes a
 * {@link provideMockStore} seeded with a full default {@link IAppState} so
 * `store.selectSignal(featureSelector)` returns sensible values out of the
 * box. Pass a partial state to seed specific slices; use
 * `store.overrideSelector(...)` / `store.setState(...)` inside the spec for
 * anything more specific (e.g. router-derived selectors).
 */
export function provideTestingProviders(
  initialState: Partial<IAppState> = {}
): TestProvider[] {
  return [
    ...BASE_TEST_PROVIDERS,
    provideMockStore({ initialState: mockAppState(initialState) }),
  ];
}

/**
 * Convenience provider set with a default seeded MockStore — enough for the
 * "should create" smoke tests and any presentational component.
 *
 * Effects specs deliberately do NOT use a shared helper: they wire
 * `provideMockActions(() => actions$)` + `provideMockStore(...)` (plus the
 * effect's own deps) inline, so each spec provides exactly what it needs.
 */
export const COMMON_TEST_PROVIDERS: TestProvider[] = provideTestingProviders();
