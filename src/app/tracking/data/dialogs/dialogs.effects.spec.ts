import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { EMPTY, Observable } from 'rxjs';
import { DialogsEffects } from './dialogs.effects';

describe('DialogsEffects (tracking)', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [
        DialogsEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
      ],
    });
    expect(TestBed.inject(DialogsEffects)).toBeTruthy();
  });
});
