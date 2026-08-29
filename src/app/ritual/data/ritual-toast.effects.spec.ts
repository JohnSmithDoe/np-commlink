import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { RitualActions } from './ritual.actions';
import { RitualToastEffects } from './ritual-toast.effects';

describe('RitualToastEffects', () => {
  let actions$: Observable<Action>;
  let effects: RitualToastEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RitualToastEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
      ],
    });
    effects = TestBed.inject(RitualToastEffects);
  });

  it('reports the dismissal and leaves the way back to settings', async () => {
    actions$ = of(RitualActions.dismissed('water'));

    const toast = await firstValueFrom(effects.undoDismissToast$);

    expect(toast).toEqual(
      expect.objectContaining({
        message: {
          key: 'ritual.toast.dismissed',
          durationMs: 6000,
          group: 'ritual-dismiss',
        },
      })
    );
  });
});
