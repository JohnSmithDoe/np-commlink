import {
  mockCashAccount,
  mockCashTransaction,
} from '../testing/cash.test-data';
import {
  selectAccountBalances,
  selectAllowanceBalanceCents,
  selectCashBalanceEuros,
  selectNetWorthCents,
} from './cash.selector';

describe('cash selectors', () => {
  describe('selectAccountBalances', () => {
    it('returns the opening balance for an account with no transactions', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 5000 });

      expect(selectAccountBalances.projector([account], [])).toEqual({
        a: 5000,
      });
    });

    it('adds signed transaction amounts to the opening balance', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 10_000 });
      const txns = [
        mockCashTransaction({ id: 't1', accountId: 'a', amountCents: -1999 }),
        mockCashTransaction({ id: 't2', accountId: 'a', amountCents: 500 }),
      ];

      expect(selectAccountBalances.projector([account], txns)).toEqual({
        a: 8501,
      });
    });

    it('ignores a reconciled-away leg so a matched pair is counted once', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 0 });
      const txns = [
        mockCashTransaction({ id: 'surv', accountId: 'a', amountCents: -1000 }),
        mockCashTransaction({
          id: 'manual',
          accountId: 'a',
          amountCents: -1000,
          matchedTxnId: 'surv',
        }),
      ];

      expect(selectAccountBalances.projector([account], txns)).toEqual({
        a: -1000,
      });
    });

    it('ignores a transaction whose account is gone', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 100 });
      const orphan = mockCashTransaction({
        id: 'orphan',
        accountId: 'gone',
        amountCents: -50,
      });

      expect(selectAccountBalances.projector([account], [orphan])).toEqual({
        a: 100,
      });
    });
  });

  describe('selectNetWorthCents', () => {
    it('sums every account balance, including the negative ones', () => {
      expect(selectNetWorthCents.projector({ a: 5000, b: -1500 })).toBe(3500);
    });

    it('is zero with no accounts at all', () => {
      expect(selectNetWorthCents.projector({})).toBe(0);
    });
  });

  describe('selectAllowanceBalanceCents', () => {
    it('leaves an excluded account out of what can be spent', () => {
      const giro = mockCashAccount({ id: 'giro' });
      const savings = mockCashAccount({
        id: 'savings',
        excludedFromAllowance: true,
      });
      expect(
        selectAllowanceBalanceCents.projector([giro, savings], {
          giro: 50_000,
          savings: 900_000,
        })
      ).toBe(50_000);
    });

    it('counts every account when none is excluded', () => {
      const giro = mockCashAccount({ id: 'giro' });
      const cash = mockCashAccount({ id: 'cash' });
      expect(
        selectAllowanceBalanceCents.projector([giro, cash], {
          giro: 50_000,
          cash: 2000,
        })
      ).toBe(52_000);
    });
  });

  describe('selectCashBalanceEuros', () => {
    it('converts whole cents to whole euros', () => {
      expect(selectCashBalanceEuros.projector(6000)).toBe(60);
      expect(selectCashBalanceEuros.projector(0)).toBe(0);
    });

    it('rounds a non-round cents total to the nearest euro (half-up)', () => {
      expect(selectCashBalanceEuros.projector(12_399)).toBe(124);
      expect(selectCashBalanceEuros.projector(12_340)).toBe(123);
    });

    it('reports a negative balance for an overdrawn ledger', () => {
      expect(selectCashBalanceEuros.projector(-2550)).toBe(-25);
    });
  });
});
