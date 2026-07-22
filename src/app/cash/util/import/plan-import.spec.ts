import {
  mockCashRule,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { IParsedRow } from './bank-parser';
import { planImport } from './plan-import';

const row = (over: Partial<IParsedRow> = {}): IParsedRow => ({
  dateISO: '2026-01-06T00:00:00+01:00',
  amountCents: -4299,
  description: 'REWE',
  rawDescription: 'REWE',
  ...over,
});

// deterministic id factory
const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe('planImport', () => {
  it('builds imported transactions with ids, batch id and confirmed status', () => {
    const plan = planImport([row()], 'acc', [], [], 'batch-1', ids());
    expect(plan.duplicates).toBe(0);
    expect(plan.toImport).toHaveLength(1);
    expect(plan.toImport[0]).toMatchObject({
      id: 'id-1',
      accountId: 'acc',
      amountCents: -4299,
      source: 'imported',
      status: 'confirmed',
      importBatchId: 'batch-1',
    });
  });

  it('skips rows already imported (natural-key dedup) and counts them', () => {
    const existing = mockCashTransaction({
      accountId: 'acc',
      dateISO: '2026-01-06T00:00:00+01:00',
      amountCents: -4299,
      rawDescription: 'REWE',
      source: 'imported',
    });
    const plan = planImport([row()], 'acc', [], [existing], 'batch-2', ids());
    expect(plan.toImport).toHaveLength(0);
    expect(plan.duplicates).toBe(1);
  });

  it('dedups a row re-imported after a timezone/DST change (keyed on the date, not the offset)', () => {
    // dateISO is a local-midnight ISO whose offset shifts with the device tz;
    // the same booking re-imported under a different offset must still match.
    const existing = mockCashTransaction({
      accountId: 'acc',
      dateISO: '2026-01-06T00:00:00+01:00',
      amountCents: -4299,
      rawDescription: 'REWE',
      source: 'imported',
    });
    const plan = planImport(
      [row({ dateISO: '2026-01-06T00:00:00+02:00' })],
      'acc',
      [],
      [existing],
      'batch-tz',
      ids()
    );
    expect(plan.toImport).toHaveLength(0);
    expect(plan.duplicates).toBe(1);
  });

  it('dedups identical rows within a single batch', () => {
    const plan = planImport([row(), row()], 'acc', [], [], 'batch-3', ids());
    expect(plan.toImport).toHaveLength(1);
    expect(plan.duplicates).toBe(1);
  });

  it('auto-categorizes via the rules (manual override not set on imports)', () => {
    const rule = mockCashRule({
      categoryId: 'groceries',
      match: 'any',
      conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
    });
    const plan = planImport([row()], 'acc', [rule], [], 'batch-4', ids());
    expect(plan.toImport[0].categoryId).toBe('groceries');
    expect(plan.toImport[0].categoryManual).toBeUndefined();
  });
});
