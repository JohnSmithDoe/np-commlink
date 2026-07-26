import {
  mockCashAccount,
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { mockCategory } from '../../../@shared/testing/test-data';
import {
  selectAccountBalances,
  selectAccountById,
  selectAccountsWithBalances,
  selectCashBalanceEuros,
  selectCashCategoriesWithCount,
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

  describe('selectCashCategoriesWithCount', () => {
    it('counts live transactions per category, alphabetical, 0 for unused', () => {
      const categories = [
        mockCategory({ id: 'c-food', name: 'Food' }),
        mockCategory({ id: 'c-bar', name: 'Bar' }),
        mockCategory({ id: 'c-unused', name: 'Unused' }),
      ];
      const txns = [
        mockCashTransaction({ id: 't1', categoryId: 'c-food' }),
        mockCashTransaction({ id: 't2', categoryId: 'c-food' }),
        mockCashTransaction({ id: 't3', categoryId: 'c-bar' }),
        // reconciled-away leg must not be counted
        mockCashTransaction({
          id: 't4',
          categoryId: 'c-bar',
          matchedTxnId: 't3',
        }),
        mockCashTransaction({ id: 't5' }), // uncategorized — ignored
      ];
      const result = selectCashCategoriesWithCount.projector(categories, txns);
      expect(result).toEqual([
        { category: categories[1], count: 1 }, // Bar (alphabetical first)
        { category: categories[0], count: 2 }, // Food
        { category: categories[2], count: 0 }, // Unused
      ]);
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
      // 12399c -> 123.99 -> 124 (a truncating impl would wrongly give 123).
      expect(
        selectCashBalanceEuros.projector(
          mockCashState({
            accounts: [mockCashAccount({ openingBalanceCents: 12_399 })],
          })
        )
      ).toBe(124);
      // 12340c -> 123.40 -> 123 (rounds down).
      expect(
        selectCashBalanceEuros.projector(
          mockCashState({
            accounts: [mockCashAccount({ openingBalanceCents: 12_340 })],
          })
        )
      ).toBe(123);
    });

    it('excludes reconciled-away legs (matchedTxnId) so a cleared spend is not double-counted', () => {
      // Manual -50 leg reconciled into the imported -50 leg: only one should
      // count, matching selectAccountBalances / the ledger views (200-50=150).
      expect(
        selectCashBalanceEuros.projector(
          mockCashState({
            accounts: [mockCashAccount({ openingBalanceCents: 20_000 })],
            transactions: [
              mockCashTransaction({ id: 't1', amountCents: -5000 }),
              mockCashTransaction({
                id: 't2',
                amountCents: -5000,
                matchedTxnId: 't1',
              }),
            ],
          })
        )
      ).toBe(150);
    });

    it('reports a negative balance for an overdrawn ledger', () => {
      // -5000c -> -50. The deck deliberately hides non-positive badges (the
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
