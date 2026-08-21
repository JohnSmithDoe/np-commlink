import {
  mockCashRule,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { ParsedRow, ParseResult } from './parsed-row';
import { planImport } from './plan-import';

const row = (over: Partial<ParsedRow> = {}): ParsedRow => ({
  dateISO: '2026-01-06T00:00:00+01:00',
  amountCents: -4299,
  description: 'NORDKAUF',
  status: 'confirmed',
  key: '2026010638472910064',
  ...over,
});

const parsed = (rows: ParsedRow[], rejected = 0): ParseResult => ({
  rows,
  rejected,
});

const imported = (over = {}) =>
  mockCashTransaction({
    accountId: 'acc',
    dateISO: '2026-01-06T00:00:00+01:00',
    amountCents: -4299,
    name: 'NORDKAUF',
    source: 'imported',
    importKey: '2026010638472910064',
    ...over,
  });

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

const plan = (
  rows: ParsedRow[],
  existing = [] as ReturnType<typeof imported>[]
) => planImport(parsed(rows), 'acc', [], existing, 'batch', ids());

describe('planImport', () => {
  it('names a row after the counterparty, not the statement line', () => {
    const [txn] = plan([
      row({
        description: 'NORDKAUF Markt GmbH — Einkauf Karte 1 27.05.',
        counterpartyName: 'NORDKAUF Markt GmbH',
        remittanceInfo: 'Einkauf Karte 1 27.05.',
      }),
    ]).toImport;

    expect(txn).toMatchObject({
      name: 'NORDKAUF Markt GmbH',
      remittanceInfo: 'Einkauf Karte 1 27.05.',
    });
  });

  it('falls back to the purpose, then the whole line', () => {
    const [withPurpose] = plan([
      row({
        description: 'ENTGELT — Kontoführung',
        remittanceInfo: 'Kontoführung',
      }),
    ]).toImport;
    expect(withPurpose?.name).toBe('Kontoführung');

    const [bare] = plan([row({ description: 'BARGELDAUSZAHLUNG' })]).toImport;
    expect(bare?.name).toBe('BARGELDAUSZAHLUNG');
  });

  it('builds imported transactions with ids, batch id and the parsed status', () => {
    const result = plan([
      row({ status: 'pending', key: '2026010638472910064' }),
    ]);

    expect(result.duplicates).toBe(0);
    expect(result.toImport[0]).toMatchObject({
      id: 'id-1',
      accountId: 'acc',
      amountCents: -4299,
      source: 'imported',
      status: 'pending',
      importBatchId: 'batch',
      importKey: '2026010638472910064',
    });
  });

  it('skips a row whose key is already imported', () => {
    const result = plan([row()], [imported()]);

    expect(result.toImport).toHaveLength(0);
    expect(result.duplicates).toBe(1);
  });

  it('keeps two same-day, same-amount, same-text rows that differ by key', () => {
    const result = plan([row(), row({ key: '2026010638472910065' })]);

    expect(result.toImport).toHaveLength(2);
    expect(result.duplicates).toBe(0);
  });

  it('dedups on the key alone — a changed date or text does not resurrect a row', () => {
    const result = plan(
      [row({ dateISO: '2026-02-01T00:00:00+01:00', description: 'renamed' })],
      [imported()]
    );

    expect(result.duplicates).toBe(1);
  });

  it('scopes the key to the account, so the same statement fills two ledgers', () => {
    const other = imported({ accountId: 'other-acc' });
    const result = plan([row()], [other]);

    expect(result.toImport).toHaveLength(1);
  });

  it('dedups repeated keys within a single batch', () => {
    const result = plan([row(), row()]);

    expect(result.toImport).toHaveLength(1);
    expect(result.duplicates).toBe(1);
  });

  it('ignores a manually entered row that happens to match', () => {
    const result = plan([row()], [imported({ source: 'manual' })]);

    expect(result.toImport).toHaveLength(1);
  });

  it('auto-categorizes via the rules (manual override not set on imports)', () => {
    const rule = mockCashRule({
      categoryId: 'stuff',
      match: 'any',
      conditions: [{ field: 'description', op: 'contains', value: 'NORDKAUF' }],
    });
    const result = planImport(
      parsed([row()]),
      'acc',
      [rule],
      [],
      'batch',
      ids()
    );

    expect(result.toImport[0].categoryIds).toEqual(['stuff']);
    expect(result.toImport[0].categoryManual).toBeUndefined();
  });

  it('carries the rejected count through untouched', () => {
    expect(
      planImport(parsed([row()], 3), 'acc', [], [], 'batch', ids()).rejected
    ).toBe(3);
  });
});
