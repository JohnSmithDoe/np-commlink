import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../@shared/util/dashboard/dashboard.actions';
import {
  mockAppState,
  mockCashAccount,
  mockCashState,
  mockCashTransaction,
} from '../../@shared/testing/test-data';
import { IAppState } from '../../@shared/types';
import {
  CashTelemetryEffects,
  selectCashBalanceEuros,
} from './cash-telemetry.effects';

describe('CashTelemetryEffects', () => {
  let effects: CashTelemetryEffects;

  const setup = (state: Partial<IAppState> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        CashTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(CashTelemetryEffects);
  };

  it('reports the net balance in whole euros to the dashboard read-model', async () => {
    setup({
      cash: mockCashState({
        accounts: [mockCashAccount({ openingBalanceCents: 10000 })],
        transactions: [mockCashTransaction({ amountCents: -2500 })],
      }),
    });

    expect(await firstValueFrom(effects.report$)).toEqual(
      DashboardActions.report({ source: 'cash', metrics: { balance: 75 } })
    );
  });

  describe('selectCashBalanceEuros', () => {
    it('sums opening balances and signed transactions, in euros', () => {
      expect(
        selectCashBalanceEuros.projector(
          mockCashState({
            accounts: [mockCashAccount({ openingBalanceCents: 5000 })],
            transactions: [
              mockCashTransaction({ amountCents: 1234 }),
              mockCashTransaction({ amountCents: -234 }),
            ],
          })
        )
      ).toBe(60);
    });

    it('is 0 for an empty ledger', () => {
      expect(selectCashBalanceEuros.projector(mockCashState())).toBe(0);
    });

    it('rounds a non-round cents total to the nearest euro (half-up)', () => {
      // 12399c → 123.99 → 124 (a truncating impl would wrongly give 123).
      expect(
        selectCashBalanceEuros.projector(
          mockCashState({
            accounts: [mockCashAccount({ openingBalanceCents: 12399 })],
          })
        )
      ).toBe(124);
      // 12340c → 123.40 → 123 (rounds down).
      expect(
        selectCashBalanceEuros.projector(
          mockCashState({
            accounts: [mockCashAccount({ openingBalanceCents: 12340 })],
          })
        )
      ).toBe(123);
    });

    it('reports a negative balance for an overdrawn ledger', () => {
      // -5000c → -50. The deck deliberately hides non-positive badges (the
      // template's `b > 0` guard), so an overdraft shows no CREDSTICK badge —
      // pinned here so that display choice is a conscious, tested one.
      expect(
        selectCashBalanceEuros.projector(
          mockCashState({
            accounts: [mockCashAccount({ openingBalanceCents: 1000 })],
            transactions: [mockCashTransaction({ amountCents: -6000 })],
          })
        )
      ).toBe(-50);
    });
  });
});
