import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../@shared/data/dashboard/dashboard.actions';
import {
  mockAppState,
  mockShoppingItem,
  mockShoppingState,
} from '../../@shared/testing/test-data';
import { IAppState } from '../../@shared/types';
import {
  selectActiveShoppingCount,
  ShoppingTelemetryEffects,
} from './shopping-telemetry.effects';

describe('ShoppingTelemetryEffects', () => {
  let effects: ShoppingTelemetryEffects;

  const setup = (state: Partial<IAppState> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        ShoppingTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(ShoppingTelemetryEffects);
  };

  it('reports the active (not-yet-bought) item count', async () => {
    setup({
      shopping: mockShoppingState({
        items: [
          mockShoppingItem({ id: 'a', state: 'active' }),
          mockShoppingItem({ id: 'b', state: 'active' }),
          mockShoppingItem({ id: 'c', state: 'bought' }),
        ],
      }),
    });

    expect(await firstValueFrom(effects.report$)).toEqual(
      DashboardActions.report({ source: 'shopping', metrics: { active: 2 } })
    );
  });

  describe('selectActiveShoppingCount', () => {
    it('excludes bought items', () => {
      expect(
        selectActiveShoppingCount.projector(
          mockShoppingState({
            items: [
              mockShoppingItem({ id: 'a', state: 'active' }),
              mockShoppingItem({ id: 'b', state: 'bought' }),
            ],
          })
        )
      ).toBe(1);
    });

    it('is 0 for an unregistered slice', () => {
      expect(selectActiveShoppingCount.projector(undefined as never)).toBe(0);
    });
  });
});
