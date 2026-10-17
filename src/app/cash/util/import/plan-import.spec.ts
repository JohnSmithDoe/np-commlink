import {
  mockCashRule,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { ParsedRow, ParseResult } from './parsed-row';
import { planImport } from './plan-import';

const row = (over: Partial<ParsedRow> = {}): ParsedRow => {
  return {
    dateISO: '2026-01-06T00:00:00+01:00',
    amountCents: -4299,
    description: 'NORDKAUF',
    status: 'confirmed',
    bankRef: '2026010638472910064',
    derivedKey: '20260106|-4299|NORDKAUF|1',
    ...over,
  };
};

const parsed = (rows: ParsedRow[], rejected = 0): ParseResult => {
  return {
    rows,
    rejected,
  };
};

const imported = (over = {}) => {
  return mockCashTransaction({
    accountId: 'acc',
    dateISO: '2026-01-06T00:00:00+01:00',
    amountCents: -4299,
    name: 'NORDKAUF',
    source: 'imported',
    importKey: '2026010638472910064',
    ...over,
  });
};

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
    const result = plan([row({ status: 'pending' })]);

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
    const result = plan([
      row(),
      row({
        bankRef: '2026010638472910065',
        derivedKey: '20260106|-4299|NORDKAUF|2',
      }),
    ]);

    expect(result.toImport).toHaveLength(2);
    expect(result.duplicates).toBe(0);
  });

  it('confirms a pending row that books a day later with a bank reference', () => {
    const pending = imported({
      id: 'pending-1',
      status: 'pending',
      importKey: '20260106|-4299|NORDKAUF|1',
    });
    const result = plan(
      [
        row({
          dateISO: '2026-01-07T00:00:00+01:00',
          derivedKey: '20260107|-4299|NORDKAUF|1',
        }),
      ],
      [pending]
    );

    expect(result.toImport).toHaveLength(0);
    expect(result.duplicates).toBe(1);
    expect(result.toConfirm).toEqual([
      {
        id: 'pending-1',
        importKey: '2026010638472910064',
        dateISO: '2026-01-07T00:00:00+01:00',
      },
    ]);
  });

  it('leaves an already confirmed row alone when its derived key matches', () => {
    const result = plan(
      [row()],
      [imported({ importKey: '20260106|-4299|NORDKAUF|1' })]
    );

    expect(result.toImport).toHaveLength(0);
    expect(result.duplicates).toBe(1);
    expect(result.toConfirm).toHaveLength(0);
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
    const plan = planImport(parsed([row()], 3), 'acc', [], [], 'batch', ids());
    expect(plan.rejected).toBe(3);
  });
});

const unkeyedPending = imported({
  id: 'pending-1',
  status: 'pending',
  importKey: '20260106|-4299|NORDKAUF|1',
});
const booked = (over: Partial<ParsedRow> = {}) => {
  return row({
    dateISO: '2026-01-08T00:00:00+01:00',
    description: 'NORDKAUF SAGT DANKE',
    derivedKey: '20260108|-4299|NORDKAUF SAGT DANKE|1',
    ...over,
  });
};

describe('planImport · a pending row the booking no longer keys to', () => {
  it('confirms it when the same amount books within three days', () => {
    const result = plan([booked()], [unkeyedPending]);

    expect(result.toImport).toEqual([]);
    expect(result.toConfirm).toEqual([
      {
        id: 'pending-1',
        importKey: '2026010638472910064',
        dateISO: '2026-01-08T00:00:00+01:00',
      },
    ]);
  });

  it('confirms it once, so a second booking of that amount is new', () => {
    const second = booked({
      bankRef: '2026010838472910099',
      derivedKey: '20260108|-4299|NORDKAUF SAGT DANKE|2',
    });
    const result = plan([booked(), second], [unkeyedPending]);

    expect(result.toConfirm).toHaveLength(1);
    expect(result.toImport).toHaveLength(1);
  });

  it('imports a booking of another amount, or a week later, as new', () => {
    const result = plan(
      [
        booked({ amountCents: -4300, derivedKey: 'other-amount' }),
        booked({
          dateISO: '2026-01-13T00:00:00+01:00',
          bankRef: '2026011338472910001',
          derivedKey: 'a-week-later',
        }),
      ],
      [unkeyedPending]
    );

    expect(result.toConfirm).toEqual([]);
    expect(result.toImport).toHaveLength(2);
  });

  it('never confirms a pending row with a pending one', () => {
    const result = plan([booked({ status: 'pending' })], [unkeyedPending]);
    expect(result.toConfirm).toEqual([]);
  });
});
