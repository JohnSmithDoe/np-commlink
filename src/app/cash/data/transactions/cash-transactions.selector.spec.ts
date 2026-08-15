/* ─── why ─────────────────────────────────────────────────────────
 * These go through the selector against a whole root state rather than
 * `.projector(...)`, because the scoped views are compositions of the
 * router AND the slice: the thing worth pinning is that the scope is
 * applied BEFORE the search, and a projector call would let each stage
 * be fed by hand and hide exactly that.
 * ───────────────────────────────────────────────────────────────── */
import { mockRouterState } from '../../../@shared/testing/test-data';
import { CashState } from '../../model/cash.types';
import { CashTransaction } from '../../model/transaction.types';
import {
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import {
  selectRoutedAccountTransactions,
  selectRoutedCategoryTransactions,
} from './cash-transactions.selector';

const rootWith = (
  transactions: CashTransaction[],
  parameters: Record<string, string>,
  overrides: Partial<CashState['transactions']> = {}
) => {
  const cash = mockCashState({ transactions });
  return {
    router: mockRouterState({ parameters }),
    cash: {
      ...cash,
      transactions: { ...cash.transactions, ...overrides },
    },
  };
};

const forAccount = (
  transactions: CashTransaction[],
  overrides: Partial<CashState['transactions']> = {}
) =>
  selectRoutedAccountTransactions(
    rootWith(transactions, { accountId: 'a' }, overrides)
  );

describe('cash transaction selectors', () => {
  describe('selectRoutedAccountTransactions', () => {
    it('keeps only the account’s txns, newest first', () => {
      const result = forAccount([
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
      ]);

      expect(result.map((txn) => txn.id)).toEqual(['t2', 't1']);
    });

    it('excludes reconciled-away legs', () => {
      const result = forAccount([
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
      ]);

      expect(result.map((txn) => txn.id)).toEqual(['t1']);
    });

    it('leaves two bookings on the same day in the order they were written', () => {
      const result = forAccount([
        mockCashTransaction({
          id: 'z',
          name: 'Zoo',
          accountId: 'a',
          dateISO: '2026-01-01',
        }),
        mockCashTransaction({
          id: 'a',
          name: 'Aldi',
          accountId: 'a',
          dateISO: '2026-01-01',
        }),
      ]);

      expect(result.map((txn) => txn.id)).toEqual(['z', 'a']);
    });

    it('tags a survivor with the id of the manual leg reconciled into it', () => {
      const result = forAccount([
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
      ]);

      expect(result.map((txn) => txn.id)).toEqual(['surv']);
      expect(result[0].reconciledManualId).toBe('manual');
    });

    it('leaves reconciledManualId undefined for an unreconciled txn', () => {
      const result = forAccount([
        mockCashTransaction({
          id: 't1',
          accountId: 'a',
          dateISO: '2026-01-01',
        }),
      ]);

      expect(result[0].reconciledManualId).toBeUndefined();
    });

    it('searches within the account, never across the whole ledger', () => {
      const result = forAccount(
        [
          mockCashTransaction({ id: 'mine', accountId: 'a', name: 'REWE' }),
          mockCashTransaction({ id: 'theirs', accountId: 'b', name: 'REWE' }),
        ],
        { searchQuery: 'REWE' }
      );

      expect(result.map((txn) => txn.id)).toEqual(['mine']);
    });

    it('narrows to the armed category chip on top of the account scope', () => {
      const result = forAccount(
        [
          mockCashTransaction({
            id: 'food',
            accountId: 'a',
            categoryIds: ['c1'],
          }),
          mockCashTransaction({ id: 'other', accountId: 'a' }),
        ],
        { filterBy: 'c1' }
      );

      expect(result.map((txn) => txn.id)).toEqual(['food']);
    });
  });

  describe('selectRoutedCategoryTransactions', () => {
    it("returns a category's live txns newest first, excluding reconciled-away legs", () => {
      const root = rootWith(
        [
          mockCashTransaction({
            id: 't1',
            categoryIds: ['c1'],
            dateISO: '2026-01-01',
          }),
          mockCashTransaction({
            id: 't3',
            categoryIds: ['c1'],
            dateISO: '2026-03-01',
          }),
          mockCashTransaction({
            id: 't2',
            categoryIds: ['c1'],
            dateISO: '2026-02-01',
          }),
          mockCashTransaction({
            id: 'x',
            categoryIds: ['c2'],
            dateISO: '2026-04-01',
          }),
          mockCashTransaction({
            id: 'away',
            categoryIds: ['c1'],
            dateISO: '2026-05-01',
            matchedTxnId: 't1',
          }),
        ],
        { categoryId: 'c1' }
      );

      expect(
        selectRoutedCategoryTransactions(root).map((txn) => txn.id)
      ).toEqual(['t3', 't2', 't1']);
    });
  });
});
