import {
  mockCashSchedule,
  mockCashTransaction,
} from '../testing/cash.test-data';
import {
  burndownFor,
  daysRemainingInMonth,
  spendsThisMonth,
  spentThisMonthCents,
  spentTodayCents,
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

describe('spentTodayCents', () => {
  it('narrows to the day, where the monthly figure takes the whole month', () => {
    const items = [
      mockCashTransaction({ id: 'a', dateISO: JANUARY_1, amountCents: -1000 }),
      mockCashTransaction({
        id: 'b',
        dateISO: '2026-01-02T09:00:00+01:00',
        amountCents: -2500,
      }),
    ];
    expect(spentTodayCents(items, JANUARY_1)).toBe(1000);
    expect(spentThisMonthCents(items, JANUARY_1)).toBe(3500);
  });

  it('counts a pending card spend, which has left even if the bank is slow', () => {
    const card = mockCashTransaction({
      dateISO: JANUARY_1,
      amountCents: -1500,
      status: 'pending',
    });
    expect(spentTodayCents([card], JANUARY_1)).toBe(1500);
  });

  it('drops a reconciled placeholder, so the pair is not counted twice', () => {
    const placeholder = mockCashTransaction({
      id: 'manual',
      dateISO: JANUARY_1,
      amountCents: -1500,
      matchedTxnId: 'imported',
    });
    const bank = mockCashTransaction({
      id: 'imported',
      dateISO: JANUARY_1,
      amountCents: -1500,
      source: 'imported',
    });
    expect(spentTodayCents([placeholder, bank], JANUARY_1)).toBe(1500);
  });
});

describe('spendsThisMonth', () => {
  it('keeps the outflows of this month, newest first', () => {
    const early = mockCashTransaction({ id: 'a', dateISO: JANUARY_1 });
    const late = mockCashTransaction({
      id: 'b',
      dateISO: '2026-01-14T09:00:00+01:00',
    });
    const income = mockCashTransaction({
      id: 'c',
      dateISO: JANUARY_1,
      amountCents: 4000,
    });
    const lastMonth = mockCashTransaction({
      id: 'd',
      dateISO: '2025-12-31T23:00:00+01:00',
    });

    expect(
      spendsThisMonth([early, late, income, lastMonth], JANUARY_1)
    ).toEqual([late, early]);
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

  it("holds today's allowance still while the day is spent", () => {
    const coffee = mockCashTransaction({
      dateISO: JANUARY_1,
      amountCents: -2500,
    });
    const before = burndownFor(310_000, [], [], JANUARY_1);
    const after = burndownFor(307_500, [coffee], [], JANUARY_1);

    expect(after.allowanceTodayCents).toBe(before.allowanceTodayCents);
    expect(after.spentTodayCents).toBe(2500);
    expect(after.remainingTodayCents).toBe(7500);
  });

  it('leaves the go-forward figure to absorb the overspend', () => {
    const splurge = mockCashTransaction({
      dateISO: JANUARY_1,
      amountCents: -50_000,
    });
    const result = burndownFor(260_000, [splurge], [], JANUARY_1);

    expect(result.remainingTodayCents).toBe(-40_000);
    expect(result.perDayCents).toBeLessThan(result.allowanceTodayCents);
  });

  it('gives the last day of the month what is left, undivided', () => {
    const result = burndownFor(4200, [], [], JANUARY_31);
    expect(result.daysRemaining).toBe(1);
    expect(result.allowanceTodayCents).toBe(4200);
    expect(result.remainingTodayCents).toBe(4200);
  });
});
