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

  it('offers the dismissal back before the toast is gone', async () => {
    actions$ = of(RitualActions.dismissed('water'));

    const toast = await firstValueFrom(effects.undoDismissToast$);

    expect(toast).toEqual(
      expect.objectContaining({
        message: expect.objectContaining({
          key: 'ritual.toast.dismissed',
          action: {
            labelKey: 'ritual.toast.undo',
            action: RitualActions.restored('water'),
          },
        }),
      })
    );
  });

  it('offers the completion back, naming the row it would remove', async () => {
    const completed = RitualActions.completed('water');
    actions$ = of(completed);

    const toast = await firstValueFrom(effects.undoCompletionToast$);

    expect(toast).toEqual(
      expect.objectContaining({
        message: expect.objectContaining({
          key: 'ritual.toast.completed',
          action: {
            labelKey: 'ritual.toast.undo',
            action: RitualActions.uncompleted('water', completed.at),
          },
        }),
      })
    );
  });

  it('keeps the two undos in separate groups, so neither silences the other', async () => {
    actions$ = of(RitualActions.dismissed('water'));
    const dismissed = await firstValueFrom(effects.undoDismissToast$);

    actions$ = of(RitualActions.completed('stretch'));
    const completed = await firstValueFrom(effects.undoCompletionToast$);

    expect(dismissed.message.group).not.toBe(completed.message.group);
  });
});
