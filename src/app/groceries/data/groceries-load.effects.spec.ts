import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockProductsState } from '../../@shared/testing/test-data';
import { DatabaseService } from '../../@shared/util/database.service';
import { GroceriesActions } from './groceries.actions';
import { GroceriesLoadEffects } from './groceries-load.effects';

describe('GroceriesLoadEffects', () => {
  let actions$: Observable<Action>;
  let effects: GroceriesLoadEffects;
  let database: { load: ReturnType<typeof vi.fn> };

  const setup = () => {
    database = { load: vi.fn().mockResolvedValue(null) };
    TestBed.configureTestingModule({
      providers: [
        GroceriesLoadEffects,
        provideMockActions(() => actions$),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(GroceriesLoadEffects);
  };

  it('reads the three grocery keys and emits one atomic loaded', async () => {
    setup();
    const products = mockProductsState();
    database.load.mockImplementation((key: string) =>
      Promise.resolve(key === 'products' ? products : null)
    );
    actions$ = of(GroceriesActions.load());

    expect(await firstValueFrom(effects.load$)).toEqual(
      GroceriesActions.loaded({ products, shopping: null, storage: null })
    );
    expect(database.load).toHaveBeenCalledWith('products');
    expect(database.load).toHaveBeenCalledWith('shopping');
    expect(database.load).toHaveBeenCalledWith('storage');
  });

  it('falls back to a nulls loaded when a read fails', async () => {
    setup();
    database.load.mockRejectedValue(new Error('storage unavailable'));
    actions$ = of(GroceriesActions.load());

    expect(await firstValueFrom(effects.load$)).toEqual(
      GroceriesActions.loaded({ products: null, shopping: null, storage: null })
    );
  });
});
