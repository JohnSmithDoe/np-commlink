import {
  mockCashAccount,
  mockCashState,
  mockCashTransaction,
} from '../testing/cash.test-data';
import { mockCategory } from '../../@shared/testing/test-data';
import {
  selectAccountBalances,
  selectCashBalanceEuros,
  selectMonthlyTotals,
  selectNetWorthCents,
  selectReportTotals,
  selectSpendByCategory,
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

  describe('reporting selectors exclude transfers + reconciled legs', () => {
    const txns = [
      mockCashTransaction({
        id: 'in',
        amountCents: 250_000,
        dateISO: '2026-01-05',
      }),
      mockCashTransaction({
        id: 'out',
        amountCents: -4299,
        categoryIds: ['cat-food'],
        dateISO: '2026-01-06',
      }),
      mockCashTransaction({
        id: 'out2',
        amountCents: -1000,
        dateISO: '2026-02-02',
      }),
      mockCashTransaction({
        id: 'xfer',
        amountCents: -5000,
        isTransfer: true,
        dateISO: '2026-01-07',
      }),
      mockCashTransaction({
        id: 'merged',
        amountCents: -4299,
        matchedTxnId: 'out',
        dateISO: '2026-01-06',
      }),
    ];

    it('selectReportTotals sums real income and spend only', () => {
      const totals = selectReportTotals.projector(txns);

      expect(totals.incomeCents).toBe(250_000);
      expect(totals.spendCents).toBe(4299 + 1000);
      expect(totals.netCents).toBe(250_000 - 5299);
    });

    it('selectMonthlyTotals buckets by month, oldest first', () => {
      const months = selectMonthlyTotals.projector(txns);

      expect(months.map((month) => month.month)).toEqual([
        '2026-01',
        '2026-02',
      ]);
      expect(months[0]).toMatchObject({
        incomeCents: 250_000,
        spendCents: 4299,
      });
    });

    it('selectSpendByCategory groups outflows, resolving the id→name via the catalog, uncategorized under ""', () => {
      const state = mockCashState({
        transactions: txns,
        categories: {
          id: '_cash-categories',
          items: [mockCategory({ id: 'cat-food', name: 'Food' })],
        },
      });

      expect(selectSpendByCategory.projector(state)).toEqual([
        { category: 'Food', cents: 4299 },
        { category: '', cents: 1000 },
      ]);
    });

    it('reads the whole ledger, never a page’s filtered view', () => {
      const searched = mockCashState({ transactions: txns });

      expect(
        selectReportTotals.projector(searched.transactions.items).incomeCents
      ).toBe(250_000);
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
