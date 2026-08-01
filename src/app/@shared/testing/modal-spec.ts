import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import type { MockInstance } from 'vitest';
import { TMockState } from './test-data';
import { provideTestingProviders } from './test-providers';

/**
 * Stand a `BaseModalDialog` subclass up for a spec.
 *
 * Every one of the eight modal specs had written this same body: configure the
 * TestBed over a seeded store, spy `ModalController.dismiss`, spy
 * `Store.dispatch`, take the instance. The `mockResolvedValue(true)` is the
 * detail worth centralising — without it `confirm()` dismisses into a rejected
 * promise and the spec fails as an unhandled rejection rather than an assertion.
 *
 * This is NOT the arrangement `test-providers` declines for effects specs: that
 * exception is about each effect providing exactly its own deps, which these
 * dialogs — a shared base with a shared shape — do not.
 */
export function setupModalSpec<T>(
  type: Type<T>,
  state: TMockState = {}
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
