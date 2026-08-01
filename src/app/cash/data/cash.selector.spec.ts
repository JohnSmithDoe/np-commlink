import {
  mockCashAccount,
  mockCashState,
  mockCashTransaction,
} from '../testing/cash.test-data';
import { mockCategory } from '../../@shared/testing/test-data';
import {
  selectAccountBalances,
  selectAccountById,
  selectAccountsWithBalances,
  selectCashBalanceEuros,
  selectCashCountByCategory,
  selectMonthlyTotals,
  selectNetWorthCents,
  selectReportTotals,
  selectSpendByCategory,
  selectTransactionsForAccount,
  selectTransactionsForCategory,
} from './cash.selector';

describe('cash selectors', () => {
  describe('selectAccountBalances', () => {
    it('returns the opening balance for an account with no transactions', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 5000 });
      const balances = selectAccountBalances.projector([account], []);
      expect(balances).toEqual({ a: 5000 });
    });

    it('adds signed transaction amounts to the opening balance', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 10_000 });
      const txns = [
        mockCashTransaction({ id: 't1', accountId: 'a', amountCents: -1999 }),
        mockCashTransaction({ id: 't2', accountId: 'a', amountCents: 500 }),
      ];
      const balances = selectAccountBalances.projector([account], txns);
      expect(balances['a']).toBe(10_000 - 1999 + 500);
    });

    it('excludes reconciled-away legs (those with a matchedTxnId)', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 0 });
      const txns = [
        mockCashTransaction({ id: 't1', accountId: 'a', amountCents: -1000 }),
        // pending manual leg merged into t1 — must not be counted again
        mockCashTransaction({
          id: 't2',
          accountId: 'a',
          amountCents: -1000,
          matchedTxnId: 't1',
        }),
      ];
      const balances = selectAccountBalances.projector([account], txns);
      expect(balances['a']).toBe(-1000);
    });

    it('ignores transactions whose account does not exist', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 0 });
      const txns = [
        mockCashTransaction({
          id: 't1',
          accountId: 'ghost',
          amountCents: -1000,
        }),
      ];
      const balances = selectAccountBalances.projector([account], txns);
      expect(balances).toEqual({ a: 0 });
    });
  });

  describe('selectNetWorthCents', () => {
    it('sums balances, netting a negative credit-card balance', () => {
      const worth = selectNetWorthCents.projector({
        giro: 10_000,
        card: -3500,
      });
      expect(worth).toBe(6500);
    });

    it('is zero with no accounts', () => {
      expect(selectNetWorthCents.projector({})).toBe(0);
    });
  });

  describe('selectAccountsWithBalances', () => {
    it('decorates each account with its running balance', () => {
      const account = mockCashAccount({ id: 'a', name: 'Giro' });
      const result = selectAccountsWithBalances.projector([account], {
        a: 4200,
      });
      expect(result).toEqual([{ ...account, balanceCents: 4200 }]);
    });

    it('falls back to the opening balance when no balance is derived', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 999 });
      const result = selectAccountsWithBalances.projector([account], {});
      expect(result[0].balanceCents).toBe(999);
    });
  });

  describe('selectAccountById', () => {
    it('finds the account with the given id', () => {
      const a = mockCashAccount({ id: 'a' });
      const b = mockCashAccount({ id: 'b' });
      expect(selectAccountById('b').projector([a, b])).toBe(b);
    });

    it('returns undefined for an unknown id', () => {
      expect(selectAccountById('ghost').projector([])).toBeUndefined();
    });
  });

  describe('selectTransactionsForAccount', () => {
    it('keeps only the account’s txns, newest first', () => {
      const txns = [
        mockCashTransaction({
          id: 't1',
          accountId: 'a',
          dateISO: '2026-01-01',
        }),
        mockCashTransaction({
          id: 't2',
          accountId: 'a',
          dateISO: '2026-03-01',
        }),
        mockCashTransaction({
          id: 't3',
          accountId: 'b',
          dateISO: '2026-02-01',
        }),
      ];
      const result = selectTransactionsForAccount('a').projector(txns);
      expect(result.map((t) => t.id)).toEqual(['t2', 't1']);
    });

    it('excludes reconciled-away legs and does not mutate the source', () => {
      const txns = [
        mockCashTransaction({
          id: 't1',
          accountId: 'a',
          dateISO: '2026-01-01',
        }),
        mockCashTransaction({
          id: 't2',
          accountId: 'a',
          dateISO: '2026-02-01',
          matchedTxnId: 't1',
        }),
      ];
      const result = selectTransactionsForAccount('a').projector(txns);
      expect(result.map((t) => t.id)).toEqual(['t1']);
      expect(txns.map((t) => t.id)).toEqual(['t1', 't2']); // unchanged
    });

    it('breaks date ties by id for a stable order', () => {
      const txns = [
        mockCashTransaction({ id: 'z', accountId: 'a', dateISO: '2026-01-01' }),
        mockCashTransaction({ id: 'a', accountId: 'a', dateISO: '2026-01-01' }),
      ];
      const result = selectTransactionsForAccount('a').projector(txns);
      expect(result.map((t) => t.id)).toEqual(['a', 'z']);
    });

    it('tags a survivor with the id of the manual leg reconciled into it', () => {
      const txns = [
        mockCashTransaction({
          id: 'surv',
          accountId: 'a',
          dateISO: '2026-01-01',
        }),
        mockCashTransaction({
          id: 'manual',
          accountId: 'a',
          dateISO: '2026-01-01',
          matchedTxnId: 'surv',
        }),
      ];
      const result = selectTransactionsForAccount('a').projector(txns);
      // the hidden manual leg is excluded; the survivor carries its id
      expect(result.map((t) => t.id)).toEqual(['surv']);
      expect(result[0].reconciledManualId).toBe('manual');
    });

    it('leaves reconciledManualId undefined for an unreconciled txn', () => {
      const txns = [
        mockCashTransaction({
          id: 't1',
          accountId: 'a',
          dateISO: '2026-01-01',
        }),
      ];
      const result = selectTransactionsForAccount('a').projector(txns);
      expect(result[0].reconciledManualId).toBeUndefined();
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
        categoryId: 'cat-food',
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
      const t = selectReportTotals.projector(txns);
      expect(t.incomeCents).toBe(250_000);
      expect(t.spendCents).toBe(4299 + 1000);
      expect(t.netCents).toBe(250_000 - 5299);
    });

    it('selectMonthlyTotals buckets by month, oldest first', () => {
      const months = selectMonthlyTotals.projector(txns);
      expect(months.map((m) => m.month)).toEqual(['2026-01', '2026-02']);
      expect(months[0]).toMatchObject({
        incomeCents: 250_000,
        spendCents: 4299,
      });
    });

    it('selectSpendByCategory groups outflows, resolving the id→name via the catalog, uncategorized under ""', () => {
      const categories = [mockCategory({ id: 'cat-food', name: 'Food' })];
      const cats = selectSpendByCategory.projector(txns, categories);
      expect(cats).toEqual([
        { category: 'Food', cents: 4299 },
        { category: '', cents: 1000 },
      ]);
    });
  });

  describe('selectCashCountByCategory', () => {
    it('counts live transactions per category, skipping reconciled-away legs', () => {
      const counts = selectCashCountByCategory.projector([
        mockCashTransaction({ id: 't1', categoryId: 'c1' }),
        mockCashTransaction({ id: 't2', categoryId: 'c1' }),
        mockCashTransaction({ id: 't3', categoryId: 'c1', matchedTxnId: 't1' }),
        mockCashTransaction({ id: 't4' }),
      ]);

      expect(counts.get('c1')).toBe(2);
      expect(counts.size).toBe(1);
    });
  });

  describe('selectTransactionsForCategory', () => {
    it("returns a category's live txns newest first, excluding reconciled-away legs", () => {
      const txns = [
        mockCashTransaction({
          id: 't1',
          categoryId: 'c1',
          dateISO: '2026-01-01',
        }),
        mockCashTransaction({
          id: 't3',
          categoryId: 'c1',
          dateISO: '2026-03-01',
        }),
        mockCashTransaction({
          id: 't2',
          categoryId: 'c1',
          dateISO: '2026-02-01',
        }),
        mockCashTransaction({
          id: 'x',
          categoryId: 'c2',
          dateISO: '2026-04-01',
        }),
        mockCashTransaction({
          id: 'away',
          categoryId: 'c1',
          dateISO: '2026-05-01',
          matchedTxnId: 't1',
        }),
      ];
      const result = selectTransactionsForCategory('c1').projector(txns);
      expect(result.map((t) => t.id)).toEqual(['t3', 't2', 't1']);
    });
  });
  // The tile reads the SAME sum as the accounts list now, so its own spec is only
  // about the cents→euros presentation. What each leg contributes to that sum
  // (reconciled-away legs excluded, orphans skipped) is pinned on
  // selectAccountBalances / selectNetWorthCents, not restated here.
  describe('selectCashBalanceEuros', () => {
    it('converts whole cents to whole euros', () => {
      expect(selectCashBalanceEuros.projector(6000)).toBe(60);
      expect(selectCashBalanceEuros.projector(0)).toBe(0);
    });

    it('rounds a non-round cents total to the nearest euro (half-up)', () => {
      // 12399c -> 123.99 -> 124 (a truncating impl would wrongly give 123).
      expect(selectCashBalanceEuros.projector(12_399)).toBe(124);
      // 12340c -> 123.40 -> 123 (rounds down).
      expect(selectCashBalanceEuros.projector(12_340)).toBe(123);
    });

    it('reports a negative balance for an overdrawn ledger', () => {
      // The deck deliberately hides non-positive badges (the template's `b > 0`
      // guard), so an overdraft shows no CREDSTICK badge — pinned here so that
      // display choice stays a conscious, tested one.
      expect(selectCashBalanceEuros.projector(-5000)).toBe(-50);
    });

    // The bug this selector's rewrite fixed: it used to sum the transaction list
    // flat, so a txn whose account had been deleted counted toward the tile while
    // the accounts list (a per-account sum) skipped it. Both now come from
    // selectAccountBalances, so the tile cannot disagree with the list it links to.
    it('agrees with the accounts list when a transaction is orphaned', () => {
      const state = mockCashState({
        accounts: [mockCashAccount({ id: 'a', openingBalanceCents: 20_000 })],
        transactions: [
          mockCashTransaction({ accountId: 'a', amountCents: -5000 }),
          mockCashTransaction({ accountId: 'deleted', amountCents: -9900 }),
        ],
      });
      const balances = selectAccountBalances.projector(
        state.accounts,
        state.transactions
      );

      expect(selectNetWorthCents.projector(balances)).toBe(15_000);
      expect(
        selectCashBalanceEuros.projector(
          selectNetWorthCents.projector(balances)
        )
      ).toBe(150);
    });
  });
});
