import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { EMPTY, Observable } from 'rxjs';
import { provideEffectsTestingProviders } from '../../@shared/testing/test-providers';
import { NotificationsEffects } from './notifications.effects';

describe('NotificationsEffects', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [
        NotificationsEffects,
        ...provideEffectsTestingProviders(actions$),
      ],
    });
    expect(TestBed.inject(NotificationsEffects)).toBeTruthy();
  });
});
