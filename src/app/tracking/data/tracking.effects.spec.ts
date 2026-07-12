import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { EMPTY, Observable } from 'rxjs';
import { provideEffectsTestingProviders } from '../../@shared/testing/test-providers';
import { TrackingEffects } from './tracking.effects';

describe('TrackingEffects', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [TrackingEffects, ...provideEffectsTestingProviders(actions$)],
    });
    expect(TestBed.inject(TrackingEffects)).toBeTruthy();
  });
});
