import { describe, expect, it } from 'vitest';
import { mockCashTransaction } from '../testing/cash.test-data';
import {
  conditionsFrom,
  descriptionStem,
  matchSummary,
  periodMonthsFrom,
  ruleFrom,
  scheduleFrom,
} from './derive.utils';

describe('descriptionStem', () => {
  it('takes the first token of at least three letters', () => {
    expect(descriptionStem('NORDKAUF FILIALE 0231 27.05.')).toBe('NORDKAUF');
  });

  it('skips tokens too short to identify anything', () => {
    expect(descriptionStem('SB NORDKAUF')).toBe('NORDKAUF');
  });

  it('keeps umlauts inside a token', () => {
    expect(descriptionStem('Bäcker Müller 12')).toBe('Bäcker');
  });

  it('falls back to the whole description when nothing qualifies', () => {
    expect(descriptionStem(' 12 34 ')).toBe('12 34');
  });
});

describe('conditionsFrom', () => {
  it('prefers the mandate id', () => {
    const txn = mockCashTransaction({
      mandateId: 'MND-42',
      counterpartyIban: 'DE00000000000000000042',
      counterpartyName: 'Wohnbau',
    });
    expect(conditionsFrom(txn)).toEqual([
      { field: 'mandateId', op: 'equals', value: 'MND-42' },
    ]);
  });

  it('falls to the IBAN, then the name, then the description stem', () => {
    const iban = 'DE00000000000000000042';
    expect(
      conditionsFrom(mockCashTransaction({ counterpartyIban: iban }))[0]
    ).toMatchObject({ field: 'counterpartyIban', op: 'equals', value: iban });

    expect(
      conditionsFrom(mockCashTransaction({ counterpartyName: 'Wohnbau ' }))[0]
    ).toMatchObject({
      field: 'counterpartyName',
      op: 'contains',
      value: 'Wohnbau',
    });

    expect(conditionsFrom(mockCashTransaction())[0]).toMatchObject({
      field: 'description',
      op: 'contains',
      value: 'NORDKAUF',
    });
  });
});

describe('ruleFrom', () => {
  it('inherits the booking category and takes the given order', () => {
    const rule = ruleFrom(
      mockCashTransaction({ categoryIds: ['cash-cat-food'] }),
      3
    );
    expect(rule).toMatchObject({
      name: 'NORDKAUF',
      categoryId: 'cash-cat-food',
      order: 3,
      match: 'all',
    });
  });

  it('derives conditions that match the booking it came from', () => {
    const txn = mockCashTransaction();
    const rule = ruleFrom(txn, 0);
    expect(matchSummary(rule, [txn], rule.categoryId).matched).toBe(1);
  });
});

describe('periodMonthsFrom', () => {
  it('reads a monthly rhythm off the dates', () => {
    expect(periodMonthsFrom(['2026-01-03', '2026-02-03', '2026-03-03'])).toBe(
      1
    );
  });

  it('snaps an imperfect quarterly rhythm to three months', () => {
    expect(periodMonthsFrom(['2026-01-03', '2026-04-05', '2026-06-30'])).toBe(
      3
    );
  });

  it('defaults to monthly with nothing to measure', () => {
    expect(periodMonthsFrom(['2026-01-03'])).toBe(1);
  });
});

const rent = (dateISO: string, amountCents = -90_000) =>
  mockCashTransaction({
    id: `txn-${dateISO}`,
    name: 'MIETE WOHNBAU',
    mandateId: 'MND-RENT',
    amountCents,
    dateISO,
  });

describe('scheduleFrom', () => {
  it('takes the booking amount and the rhythm of its history', () => {
    const seed = rent('2026-03-01', -95_000);
    const schedule = scheduleFrom(seed, [
      rent('2026-01-01'),
      rent('2026-02-01'),
      seed,
    ]);

    expect(schedule).toMatchObject({
      amountCents: -95_000,
      periodMonths: 1,
      conditions: [{ field: 'mandateId', op: 'equals', value: 'MND-RENT' }],
    });
    expect(schedule.nextDueISO.slice(0, 7)).toBe('2026-04');
  });

  it('counts from the latest booking, not the seed', () => {
    const schedule = scheduleFrom(rent('2026-01-01'), [
      rent('2026-01-01'),
      rent('2026-02-01'),
    ]);
    expect(schedule.nextDueISO.slice(0, 7)).toBe('2026-03');
  });
});

describe('matchSummary', () => {
  const conditionSet = {
    match: 'all',
    conditions: [{ field: 'description', op: 'contains', value: 'NORDKAUF' }],
  } as const;

  it('counts matches and flags the ones filed elsewhere', () => {
    const summary = matchSummary(
      conditionSet,
      [
        mockCashTransaction({ id: 'a', dateISO: '2026-01-01' }),
        mockCashTransaction({
          id: 'b',
          dateISO: '2026-02-01',
          categoryIds: ['cash-cat-other'],
        }),
        mockCashTransaction({ id: 'c', name: 'MIETE' }),
      ],
      'cash-cat-food'
    );

    expect(summary).toMatchObject({ matched: 2, total: 3, conflicting: 1 });
    expect(summary.sample.map(({ id }) => id)).toEqual(['b', 'a']);
  });
});
