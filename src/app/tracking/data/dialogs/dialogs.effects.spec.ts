import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { EMPTY, Observable } from 'rxjs';
import { provideEffectsTestingProviders } from '../../../@shared/testing/test-providers';
import { DialogsEffects } from './dialogs.effects';

describe('DialogsEffects (tracking)', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [DialogsEffects, ...provideEffectsTestingProviders(actions$)],
    });
    expect(TestBed.inject(DialogsEffects)).toBeTruthy();
  });
});
