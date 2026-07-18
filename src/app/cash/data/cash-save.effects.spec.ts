import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { mockAppState } from '../../@shared/testing/test-data';
import { mockCashState } from '../testing/cash.test-data';
import { DatabaseService } from '../../@shared/util/database.service';
import { CashActions } from './cash.actions';
import { CashSaveEffects } from './cash-save.effects';

describe('CashSaveEffects', () => {
  let actions$: Observable<Action>;
  let effects: CashSaveEffects;
  let database: { save: ReturnType<typeof vi.fn> };

  const setup = (initialState = mockAppState()) => {
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        CashSaveEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(CashSaveEffects);
    return initialState;
  };

  it('does NOT persist on the [Cash] load/loaded hydration lifecycle', async () => {
    // Regression: `[Cash] load` fires on route entry at empty initialState
    // before the load effect reads storage — persisting here would clobber the
    // saved ledger.
    setup(mockAppState({ cash: mockCashState() }));
    actions$ = of(CashActions.load(), CashActions.loaded(mockCashState()));

    const emitted = await firstValueFrom(effects.saveOnChange$.pipe(toArray()));

    expect(emitted).toEqual([]);
    expect(database.save).not.toHaveBeenCalled();
  });

  it('persists on a real [Cash] mutation', async () => {
    const cash = mockCashState();
    setup(mockAppState({ cash }));
    actions$ = of(CashActions.addCategory('groceries'));

    await firstValueFrom(effects.saveOnChange$);

    expect(database.save).toHaveBeenCalledWith('cash', cash);
  });
});
