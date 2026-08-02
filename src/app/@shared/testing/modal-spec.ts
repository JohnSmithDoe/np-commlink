import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import type { MockInstance } from 'vitest';
import { MockState } from './test-data';
import { provideTestingProviders } from './test-providers';

export function setupModalSpec<T>(
  type: Type<T>,
  state: MockState = {}
): { component: T; dispatch: MockInstance; dismiss: MockInstance } {
  TestBed.configureTestingModule({
    imports: [type],
    providers: [provideTestingProviders(state)],
  });
  const dismiss = vi
    .spyOn(TestBed.inject(ModalController), 'dismiss')
    .mockResolvedValue(true);
  const dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
  return {
    component: TestBed.createComponent(type).componentInstance,
    dispatch,
    dismiss,
  };
}
