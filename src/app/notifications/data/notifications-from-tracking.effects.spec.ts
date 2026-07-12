import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { EMPTY, Observable } from 'rxjs';
import { provideEffectsTestingProviders } from '../../@shared/testing/test-providers';
import { NotificationsFromTrackingEffects } from './notifications-from-tracking.effects';

describe('NotificationsFromTrackingEffects', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [
        NotificationsFromTrackingEffects,
        ...provideEffectsTestingProviders(actions$),
      ],
    });
    expect(TestBed.inject(NotificationsFromTrackingEffects)).toBeTruthy();
  });
});
