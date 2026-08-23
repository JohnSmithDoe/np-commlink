import { mockCategory } from '../../@shared/testing/test-data';
import { mockCashTransaction } from '../testing/cash.test-data';
import { inScope, reportFor, windowStartISO } from './report.utils';

const TODAY = '2026-08-20T12:00:00+02:00';
const CATEGORIES = [mockCategory({ id: 'cat-food', name: 'Food' })];

const ledger = [
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

describe('windowStartISO', () => {
  it('starts a month scope at the first of this month', () => {
    expect(windowStartISO('month', TODAY)?.slice(0, 10)).toBe('2026-08-01');
  });

  it('reaches back two further months for a quarter', () => {
    expect(windowStartISO('quarter', TODAY)?.slice(0, 10)).toBe('2026-06-01');
  });

  it('starts a year scope in January and bounds nothing for all', () => {
    expect(windowStartISO('year', TODAY)?.slice(0, 10)).toBe('2026-01-01');
    expect(windowStartISO('all', TODAY)).toBeUndefined();
  });
});

describe('inScope', () => {
  it('drops a transfer leg and a reconciled-away row', () => {
    expect(inScope(ledger, 'all', TODAY).map(({ id }) => id)).toEqual([
      'in',
      'out',
      'out2',
    ]);
  });

  it('drops everything before the window', () => {
    expect(inScope(ledger, 'month', TODAY)).toEqual([]);
  });
});

describe('reportFor', () => {
  const report = reportFor(ledger, CATEGORIES, 'all', TODAY);

  it('sums real income and spend only', () => {
    expect(report.totals).toEqual({
      incomeCents: 250_000,
      spendCents: 5299,
      netCents: 244_701,
    });
  });

  it('buckets by month, oldest first', () => {
    expect(report.monthly.map(({ month }) => month)).toEqual([
      '2026-01',
      '2026-02',
    ]);
    expect(report.monthly[0]).toMatchObject({
      incomeCents: 250_000,
      spendCents: 4299,
    });
  });

  it('names categories through the catalog and files the rest under ""', () => {
    expect(report.byCategory).toEqual([
      { categoryId: 'cat-food', category: 'Food', cents: 4299 },
      { categoryId: '', category: '', cents: 1000 },
    ]);
  });

  it('keeps two same-named categories apart, which is what a row is keyed by', () => {
    const twins = [
      mockCategory({ id: 'cat-a', name: 'Essen' }),
      mockCategory({ id: 'cat-b', name: 'Essen' }),
    ];
    const spends = [
      mockCashTransaction({
        id: 'a',
        amountCents: -100,
        categoryIds: ['cat-a'],
      }),
      mockCashTransaction({
        id: 'b',
        amountCents: -200,
        categoryIds: ['cat-b'],
      }),
    ];

    expect(
      reportFor(spends, twins, 'all', TODAY).byCategory.map(
        ({ categoryId }) => categoryId
      )
    ).toEqual(['cat-b', 'cat-a']);
  });

  it('ranks outflows by magnitude, ignoring income', () => {
    expect(report.biggest.map(({ id }) => id)).toEqual(['out', 'out2']);
    expect(report.biggest[0]?.cents).toBe(4299);
  });

  it('reports what fraction of spend has no category', () => {
    expect(report.uncategorized).toEqual({
      totalCents: 5299,
      uncategorizedCents: 1000,
      percent: 19,
    });
  });

  it('reports zero rather than dividing by an empty window', () => {
    expect(reportFor([], CATEGORIES, 'all', TODAY).uncategorized.percent).toBe(
      0
    );
  });

  it('groups counterparties by IBAN, which a fuzzy name could not do', () => {
    const iban = 'DE00000000000000000042';
    const grouped = reportFor(
      [
        mockCashTransaction({
          id: 'a',
          counterpartyIban: iban,
          counterpartyName: 'NORDKAUF Markt GmbH',
          amountCents: -1999,
        }),
        mockCashTransaction({
          id: 'b',
          counterpartyIban: iban,
          counterpartyName: 'NORDKAUF Markt GmbH',
          amountCents: -3001,
        }),
        mockCashTransaction({ id: 'typed', amountCents: -1000 }),
      ],
      CATEGORIES,
      'all',
      TODAY
    );

    expect(grouped.byCounterparty).toEqual([
      { iban, name: 'NORDKAUF Markt GmbH', cents: 5000 },
    ]);
  });
});

describe('unfiled', () => {
  it('lists unfiled spending biggest first, never income', () => {
    const { unfiled } = reportFor(
      [
        mockCashTransaction({ id: 'small', amountCents: -1000 }),
        mockCashTransaction({ id: 'big', amountCents: -90_000 }),
        mockCashTransaction({ id: 'salary', amountCents: 350_000 }),
        mockCashTransaction({
          id: 'filed',
          amountCents: -5000,
          categoryIds: ['cat-food'],
        }),
      ],
      CATEGORIES,
      'all',
      TODAY
    );

    expect(unfiled.map(({ id }) => id)).toEqual(['big', 'small']);
  });
});
