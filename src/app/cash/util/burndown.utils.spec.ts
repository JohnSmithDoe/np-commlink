import {
  mockCashSchedule,
  mockCashTransaction,
} from '../testing/cash.test-data';
import {
  burndownFor,
  daysRemainingInMonth,
  spentThisMonthCents,
} from './burndown.utils';

const JANUARY_1 = '2026-01-01T09:00:00+01:00';
const JANUARY_31 = '2026-01-31T09:00:00+01:00';

describe('daysRemainingInMonth', () => {
  it('counts today, so the last day divides by one', () => {
    expect(daysRemainingInMonth(JANUARY_1)).toBe(31);
    expect(daysRemainingInMonth(JANUARY_31)).toBe(1);
  });
});

describe('spentThisMonthCents', () => {
  it('sums the outflows of this month and ignores income and transfers', () => {
    const items = [
      mockCashTransaction({ id: 'a', dateISO: JANUARY_1, amountCents: -1000 }),
      mockCashTransaction({ id: 'b', dateISO: JANUARY_1, amountCents: 5000 }),
      mockCashTransaction({
        id: 'c',
        dateISO: JANUARY_1,
        amountCents: -2000,
        isTransfer: true,
      }),
      mockCashTransaction({
        id: 'd',
        dateISO: '2025-12-20T00:00:00+01:00',
        amountCents: -9999,
      }),
    ];
    expect(spentThisMonthCents(items, JANUARY_1)).toBe(1000);
  });
});

describe('burndownFor', () => {
  it('spends from the balance minus reserve and what is still due', () => {
    const rent = mockCashSchedule({
      amountCents: -90_000,
      nextDueISO: '2026-01-20T00:00:00+01:00',
    });
    const premium = mockCashSchedule({
      id: 's2',
      amountCents: -60_000,
      periodMonths: 12,
      nextDueISO: '2026-12-01T00:00:00+01:00',
    });

    const result = burndownFor(200_000, [], [rent, premium], JANUARY_1);

    expect(result.reserveCents).toBe(5455);
    expect(result.stillDueCents).toBe(90_000);
    expect(result.spendableCents).toBe(104_545);
    expect(result.daysRemaining).toBe(31);
    expect(result.perDayCents).toBe(3372);
  });

  it('goes negative rather than pretending, when commitments exceed the balance', () => {
    const rent = mockCashSchedule({
      amountCents: -90_000,
      nextDueISO: '2026-01-20T00:00:00+01:00',
    });
    expect(burndownFor(50_000, [], [rent], JANUARY_1).perDayCents).toBeLessThan(
      0
    );
  });

  it('divides the whole balance by the days when nothing is committed', () => {
    const result = burndownFor(310_000, [], [], JANUARY_1);
    expect(result.reserveCents).toBe(0);
    expect(result.perDayCents).toBe(10_000);
  });
});
