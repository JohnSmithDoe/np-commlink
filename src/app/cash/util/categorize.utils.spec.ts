import { mockCashRule, mockCashTransaction } from '../testing/cash.test-data';
import {
  categorize,
  matchesCondition,
  matchesRule,
  recategorizations,
  ruleStats,
} from './categorize.utils';

describe('categorize util', () => {
  describe('matchesCondition — description', () => {
    const txn = mockCashTransaction({ name: 'NORDKAUF SAGT DANKE' });

    it('contains / startsWith / endsWith / equals are case-insensitive by default', () => {
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'contains',
          value: 'nordkauf',
        })
      ).toBe(true);
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'startsWith',
          value: 'nordkauf',
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
          value: 'nordkauf sagt danke',
        })
      ).toBe(true);
    });

    it('honours caseSensitive', () => {
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'contains',
          value: 'nordkauf',
          caseSensitive: true,
        })
      ).toBe(false);
    });

    it('matches a regex and never throws on a bad pattern', () => {
      expect(
        matchesCondition(txn, {
          field: 'description',
          op: 'regex',
          value: 'n.rdkauf',
        })
      ).toBe(true);
      expect(
        matchesCondition(txn, { field: 'description', op: 'regex', value: '(' })
      ).toBe(false);
    });

    it('matches against the imported bank text as stored', () => {
      const imported = mockCashTransaction({
        name: 'LANDMARKT//NEUSTADT/DE',
      });
      expect(
        matchesCondition(imported, {
          field: 'description',
          op: 'contains',
          value: 'landmarkt',
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

  describe('matchesCondition — the structured camt fields', () => {
    const imported = mockCashTransaction({
      name: 'NORDKAUF Markt GmbH — Einkauf',
      counterpartyName: 'NORDKAUF Markt GmbH',
      counterpartyIban: 'DE68500105179876543210',
      mandateId: 'MND-00042',
      purposeCode: 'GDDS',
    });

    it('matches an IBAN exactly, where a description could only guess', () => {
      expect(
        matchesCondition(imported, {
          field: 'counterpartyIban',
          op: 'equals',
          value: 'de68500105179876543210',
        })
      ).toBe(true);
    });

    it('matches the counterparty without the purpose bleeding in', () => {
      expect(
        matchesCondition(imported, {
          field: 'counterpartyName',
          op: 'endsWith',
          value: 'GmbH',
        })
      ).toBe(true);
      expect(
        matchesCondition(imported, {
          field: 'counterpartyName',
          op: 'contains',
          value: 'Einkauf',
        })
      ).toBe(false);
    });

    it('never matches a field the statement did not carry', () => {
      const manual = mockCashTransaction();
      expect(
        matchesCondition(manual, {
          field: 'counterpartyIban',
          op: 'contains',
          value: 'DE',
        })
      ).toBe(false);
      expect(
        matchesCondition(manual, {
          field: 'mandateId',
          op: 'equals',
          value: '',
        })
      ).toBe(false);
    });
  });

  describe('matchesRule', () => {
    const txn = mockCashTransaction({
      name: 'NORDKAUF',
      amountCents: -4299,
    });

    it('AND requires every condition; OR requires one', () => {
      const conds = [
        {
          field: 'description' as const,
          op: 'contains' as const,
          value: 'NORDKAUF',
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
    const txn = mockCashTransaction({ name: 'NORDKAUF SAGT DANKE' });

    it('returns the winning rule’s category id regardless of array order', () => {
      const rules = [
        mockCashRule({
          id: 'r2',
          order: 1,
          categoryId: 'shopping',
          conditions: [
            { field: 'description', op: 'contains', value: 'NORDKAUF' },
          ],
        }),
        mockCashRule({
          id: 'r1',
          order: 0,
          categoryId: 'groceries',
          conditions: [
            { field: 'description', op: 'contains', value: 'NORDKAUF' },
          ],
        }),
      ];
      expect(categorize(txn, rules)).toBe('groceries');
    });

    it('returns undefined when no rule matches', () => {
      const rules = [
        mockCashRule({
          conditions: [
            { field: 'description', op: 'contains', value: 'PRIMO' },
          ],
        }),
      ];
      expect(categorize(txn, rules)).toBeUndefined();
    });
  });

  describe('recategorizations', () => {
    const nordkaufRule = mockCashRule({
      id: 'r1',
      order: 0,
      categoryId: 'groceries',
      conditions: [{ field: 'description', op: 'contains', value: 'NORDKAUF' }],
    });

    it('reports only the transactions whose category actually changes', () => {
      const changes = recategorizations(
        [
          mockCashTransaction({ id: 'a', name: 'NORDKAUF SAGT DANKE' }),
          mockCashTransaction({
            id: 'b',
            name: 'NORDKAUF SAGT DANKE',
            categoryIds: ['groceries'],
          }),
          mockCashTransaction({ id: 'c', name: 'PRIMO' }),
        ],
        [nordkaufRule]
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
            name: 'NORDKAUF SAGT DANKE',
            categoryIds: ['fun'],
            categoryManual: true,
          }),
        ],
        [nordkaufRule]
      );
      expect(changes).toEqual([]);
    });

    it('clears a category that no rule claims any more', () => {
      const changes = recategorizations(
        [
          mockCashTransaction({
            id: 'a',
            name: 'PRIMO',
            categoryIds: ['groceries'],
          }),
        ],
        [nordkaufRule]
      );
      expect(changes).toEqual([{ transactionId: 'a', categoryId: undefined }]);
    });
  });

  describe('ruleStats', () => {
    const broad = mockCashRule({
      id: 'broad',
      order: 0,
      conditions: [{ field: 'description', op: 'contains', value: 'NORD' }],
    });
    const narrow = mockCashRule({
      id: 'narrow',
      order: 1,
      conditions: [{ field: 'description', op: 'contains', value: 'NORDKAUF' }],
    });
    const dead = mockCashRule({
      id: 'dead',
      order: 2,
      conditions: [{ field: 'description', op: 'contains', value: 'PRIMO' }],
    });

    it('separates what a rule matches from what it claims', () => {
      const stats = ruleStats(
        [mockCashTransaction({ name: 'NORDKAUF SAGT DANKE' })],
        [narrow, broad, dead]
      );

      expect(stats).toEqual({
        broad: { matched: 1, claimed: 1 },
        narrow: { matched: 1, claimed: 0 },
        dead: { matched: 0, claimed: 0 },
      });
    });

    it('reads the arrangement, not the array order', () => {
      const stats = ruleStats(
        [mockCashTransaction({ name: 'NORDKAUF SAGT DANKE' })],
        [{ ...broad, order: 5 }, narrow]
      );

      expect(stats['narrow']?.claimed).toBe(1);
      expect(stats['broad']?.claimed).toBe(0);
    });
  });
});
