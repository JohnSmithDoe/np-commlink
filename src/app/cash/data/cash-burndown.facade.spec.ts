import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TodayService } from '../../@shared/data/services/today.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { CashAccount } from '../model/account.types';
import { CashTransaction } from '../model/transaction.types';
import {
  mockCashAccount,
  mockCashState,
  mockCashTransaction,
} from '../testing/cash.test-data';
import { CashBurndownFacade } from './cash-burndown.facade';

const JANUARY_1 = '2026-01-01T09:00:00+01:00';

const giro = mockCashAccount({ openingBalanceCents: 32_000 });
const savings = mockCashAccount({
  id: 'savings',
  name: 'Tagesgeld',
  openingBalanceCents: 500_000,
  excludedFromAllowance: true,
});

const facadeOver = (
  accounts: CashAccount[],
  transactions: CashTransaction[]
): CashBurndownFacade => {
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({
        cash: mockCashState({ accounts, transactions }),
      }),
      { provide: TodayService, useValue: { today: signal('2026-01-01') } },
    ],
  });
  return TestBed.inject(CashBurndownFacade);
};

describe('CashBurndownFacade', () => {
  it('spends from the allowance what left an account inside it', () => {
    const coffee = mockCashTransaction({
      dateISO: JANUARY_1,
      amountCents: -1000,
    });

    const { burndown } = facadeOver([giro, savings], [coffee]);

    expect(burndown()).toEqual(
      expect.objectContaining({
        balanceCents: 31_000,
        spentTodayCents: 1000,
        allowanceTodayCents: 1032,
        remainingTodayCents: 32,
      })
    );
  });

  it('leaves out a spend from an account the allowance excludes, as its balance is', () => {
    const giroOnly = { ...giro, openingBalanceCents: 31_000 };
    const fromSavings = mockCashTransaction({
      accountId: savings.id,
      dateISO: JANUARY_1,
      amountCents: -1000,
    });

    const facade = facadeOver([giroOnly, savings], [fromSavings]);

    expect(facade.burndown()).toEqual(
      expect.objectContaining({
        balanceCents: 31_000,
        spentThisMonthCents: 0,
        spentTodayCents: 0,
        allowanceTodayCents: 1000,
        remainingTodayCents: 1000,
      })
    );
    expect(facade.monthSpends()).toEqual([]);
  });
});
