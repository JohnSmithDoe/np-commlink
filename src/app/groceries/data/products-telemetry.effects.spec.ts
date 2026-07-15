import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../@shared/data/dashboard/dashboard.actions';
import {
  mockAppState,
  mockProduct,
  mockProductsState,
} from '../../@shared/testing/test-data';
import { IAppState } from '../../@shared/types';
import {
  ProductsTelemetryEffects,
  selectProductCount,
} from './products-telemetry.effects';

describe('ProductsTelemetryEffects', () => {
  let effects: ProductsTelemetryEffects;

  const setup = (state: Partial<IAppState> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        ProductsTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(ProductsTelemetryEffects);
  };

  it('reports the product count to the dashboard read-model', async () => {
    setup({
      products: mockProductsState({
        items: [
          mockProduct({ id: 'a' }),
          mockProduct({ id: 'b' }),
          mockProduct({ id: 'c' }),
        ],
      }),
    });

    expect(await firstValueFrom(effects.report$)).toEqual(
      DashboardActions.report({ source: 'products', metrics: { count: 3 } })
    );
  });

  describe('selectProductCount', () => {
    it('is 0 for an unregistered slice', () => {
      expect(selectProductCount.projector(undefined as never)).toBe(0);
    });
  });
});
