import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../../@shared/data/dashboard/dashboard.actions';
import { mockAppState, TMockState } from '../../../@shared/testing/test-data';
import {
  mockStorageItem,
  mockStorageState,
} from '../../testing/grocery.test-data';
import {
  selectLowStockCount,
  StorageTelemetryEffects,
} from './storage-telemetry.effects';

describe('StorageTelemetryEffects', () => {
  let effects: StorageTelemetryEffects;

  const setup = (state: TMockState = {}) => {
    TestBed.configureTestingModule({
      providers: [
        StorageTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(StorageTelemetryEffects);
  };

  it('reports the low-stock item count', async () => {
    setup({
      storage: mockStorageState({
        items: [
          mockStorageItem({ id: 'low', quantity: 1, minAmount: 5 }),
          mockStorageItem({ id: 'at-min', quantity: 5, minAmount: 5 }),
          mockStorageItem({ id: 'no-min', quantity: 0 }),
        ],
      }),
    });

    expect(await firstValueFrom(effects.report$)).toEqual(
      DashboardActions.report({ source: 'storage', metrics: { low: 1 } })
    );
  });

  describe('selectLowStockCount', () => {
    it('counts only items strictly below their minAmount (at-min is a warning)', () => {
      expect(
        selectLowStockCount.projector(
          mockStorageState({
            items: [
              mockStorageItem({ id: 'low', quantity: 2, minAmount: 3 }),
              mockStorageItem({ id: 'at-min', quantity: 3, minAmount: 3 }),
              mockStorageItem({ id: 'no-min', quantity: 0 }),
            ],
          })
        )
      ).toBe(1);
    });

    it('is 0 for an unregistered slice', () => {
      expect(selectLowStockCount.projector(undefined as never)).toBe(0);
    });
  });
});
