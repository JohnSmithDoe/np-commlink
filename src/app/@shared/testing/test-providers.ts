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
import { provideTranslateService } from '@ngx-translate/core';
import { mockKernelState, MockState } from './test-data';

type TestProvider = Provider | EnvironmentProviders;

const BASE_TEST_PROVIDERS: TestProvider[] = [
  provideZonelessChangeDetection(),
  provideHttpClient(),
  provideIonicAngular(),
  provideRouter([]),
  provideTranslateService(),
  importProvidersFrom(IonicStorageModule.forRoot()),
];

export function provideTestingProviders(
  initialState: MockState = {}
): TestProvider[] {
  return [
    ...BASE_TEST_PROVIDERS,
    provideMockStore({ initialState: mockKernelState(initialState) }),
  ];
}

export const COMMON_TEST_PROVIDERS: TestProvider[] = provideTestingProviders();
