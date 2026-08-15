import { mockCashRule, mockCashTransaction } from '../testing/cash.test-data';
import {
  categorize,
  matchesCondition,
  matchesRule,
  recategorizations,
} from './categorize.utils';

describe('categorize util', () => {
  describe('matchesCondition — description', () => {
    const txn = mockCashTransaction({ name: 'REWE SAGT DANKE' });

    it('contains / startsWith / endsWith / equals are case-insensitive by default', () => {
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'contains',
          value: 'rewe',
        })
      ).toBe(true);
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'startsWith',
          value: 'rewe',
        })
      ).toBe(true);
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'endsWith',
          value: 'danke',
        })
      ).toBe(true);
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'equals',
          value: 'rewe sagt danke',
        })
      ).toBe(true);
    });

    it('honours caseSensitive', () => {
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'contains',
          value: 'rewe',
          caseSensitive: true,
        })
      ).toBe(false);
    });

    it('matches a regex and never throws on a bad pattern', () => {
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'regex',
          value: 'r.we',
        })
      ).toBe(true);
      expect(
        matchesCondition(txn, { field: 'description', op: 'regex', value: '(' })
      ).toBe(false);
    });

    it('matches against the imported bank text as stored', () => {
      const imported = mockCashTransaction({
        name: 'EDEKA//STUTTGART/DE',
      });
      expect(
        matchesCondition(imported, {
          field: 'description',
          op: 'contains',
          value: 'edeka',
        })
      ).toBe(true);
    });

    it('rejects a numeric op used on description', () => {
      expect(
        matchesCondition(txn, { field: 'description', op: 'gt', value: '0' })
      ).toBe(false);
    });
  });

  describe('matchesCondition — amount (signed cents vs a euro threshold)', () => {
    const spend = mockCashTransaction({ amountCents: -4299 });

    it('compares signed cents with lt/lte/gt/gte/eq', () => {
      expect(
        matchesCondition(spend, { field: 'amount', op: 'lt', value: '0' })
      ).toBe(true);
      expect(
        matchesCondition(spend, { field: 'amount', op: 'gte', value: '-50' })
      ).toBe(true);
      expect(
        matchesCondition(spend, { field: 'amount', op: 'gt', value: '0' })
      ).toBe(false);
      expect(
        matchesCondition(spend, { field: 'amount', op: 'eq', value: '-42,99' })
      ).toBe(true);
    });

    it('never matches on an unparseable threshold', () => {
      expect(
        matchesCondition(spend, { field: 'amount', op: 'lt', value: 'x' })
      ).toBe(false);
    });
  });

  describe('matchesRule', () => {
    const txn = mockCashTransaction({
      name: 'REWE',
      amountCents: -4299,
    });

    it('AND requires every condition; OR requires one', () => {
      const conds = [
        {
          field: 'description' as const,
          op: 'contains' as const,
          value: 'REWE',
        },
        { field: 'amount' as const, op: 'gt' as const, value: '0' },
      ];
      expect(
        matchesRule(txn, mockCashRule({ match: 'all', conditions: conds }))
      ).toBe(false);
      expect(
        matchesRule(txn, mockCashRule({ match: 'any', conditions: conds }))
      ).toBe(true);
    });

    it('an empty rule never fires', () => {
      expect(matchesRule(txn, mockCashRule({ conditions: [] }))).toBe(false);
    });
  });

  describe('categorize — first matching rule by order wins', () => {
    const txn = mockCashTransaction({ name: 'REWE SAGT DANKE' });

    it('returns the winning rule’s category id regardless of array order', () => {
      const rules = [
        mockCashRule({
          id: 'r2',
          order: 1,
          categoryId: 'shopping',
          conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
        }),
        mockCashRule({
          id: 'r1',
          order: 0,
          categoryId: 'groceries',
          conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
        }),
      ];
      expect(categorize(txn, rules)).toBe('groceries');
    });

    it('returns undefined when no rule matches', () => {
      const rules = [
        mockCashRule({
          conditions: [{ field: 'description', op: 'contains', value: 'ALDI' }],
        }),
      ];
      expect(categorize(txn, rules)).toBeUndefined();
    });
  });

  describe('recategorizations', () => {
    const reweRule = mockCashRule({
      id: 'r1',
      order: 0,
      categoryId: 'groceries',
      conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
    });

    it('reports only the transactions whose category actually changes', () => {
      const changes = recategorizations(
        [
          mockCashTransaction({ id: 'a', name: 'REWE SAGT DANKE' }),
          mockCashTransaction({
            id: 'b',
            name: 'REWE SAGT DANKE',
            categoryIds: ['groceries'],
          }),
          mockCashTransaction({ id: 'c', name: 'ALDI' }),
        ],
        [reweRule]
      );
      expect(changes).toEqual([
        { transactionId: 'a', categoryId: 'groceries' },
      ]);
    });

    it('never touches a transaction the user filed manually', () => {
      const changes = recategorizations(
        [
          mockCashTransaction({
            id: 'a',
            name: 'REWE SAGT DANKE',
            categoryIds: ['fun'],
            categoryManual: true,
          }),
        ],
        [reweRule]
      );
      expect(changes).toEqual([]);
    });

    it('clears a category that no rule claims any more', () => {
      const changes = recategorizations(
        [
          mockCashTransaction({
            id: 'a',
            name: 'ALDI',
            categoryIds: ['groceries'],
          }),
        ],
        [reweRule]
      );
      expect(changes).toEqual([{ transactionId: 'a', categoryId: undefined }]);
    });
  });
});
