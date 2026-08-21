import {
  mockCashSchedule,
  mockCashTransaction,
} from '../testing/cash.test-data';
import {
  advanced,
  amountChangesFor,
  dueStatus,
  dueThisMonthCents,
  matchesSchedule,
  monthsUntilDue,
  reserveCentsPerMonth,
  reserveTotalCents,
  scheduleFor,
} from './schedule.utils';

const JANUARY_6 = '2026-01-06T12:00:00+01:00';

describe('matchesSchedule', () => {
  it('recognises a booking by the same conditions a rule would use', () => {
    const rent = mockCashSchedule();
    expect(
      matchesSchedule(mockCashTransaction({ name: 'MIETE Januar' }), rent)
    ).toBe(true);
    expect(matchesSchedule(mockCashTransaction(), rent)).toBe(false);
  });

  it('picks the schedule whose conditions match, not the first in the list', () => {
    const rent = mockCashSchedule();
    const power = mockCashSchedule({
      id: 's2',
      name: 'Strom',
      conditions: [
        { field: 'description', op: 'contains', value: 'STADTWERKE' },
      ],
    });
    expect(
      scheduleFor(mockCashTransaction({ name: 'MIETE Januar' }), [power, rent])
        ?.id
    ).toBe(rent.id);
  });
});

describe('monthsUntilDue', () => {
  it('counts whole months from this month to the due month', () => {
    const yearly = mockCashSchedule({
      nextDueISO: '2026-12-01T00:00:00+01:00',
    });
    expect(monthsUntilDue(yearly, JANUARY_6)).toBe(11);
  });

  it('is zero in the due month and never negative when overdue', () => {
    expect(
      monthsUntilDue(
        mockCashSchedule({ nextDueISO: '2026-01-20T00:00:00+01:00' }),
        JANUARY_6
      )
    ).toBe(0);
    expect(
      monthsUntilDue(
        mockCashSchedule({ nextDueISO: '2025-11-01T00:00:00+01:00' }),
        JANUARY_6
      )
    ).toBe(0);
  });
});

describe('reserveCentsPerMonth', () => {
  it('spreads a yearly premium over the months remaining, not the period', () => {
    const premium = mockCashSchedule({
      amountCents: -60_000,
      periodMonths: 12,
      nextDueISO: '2026-12-01T00:00:00+01:00',
    });
    expect(reserveCentsPerMonth(premium, JANUARY_6)).toBe(5455); // 600 ÷ 11
  });

  it('demands the whole amount when the due month has arrived', () => {
    const premium = mockCashSchedule({
      amountCents: -60_000,
      nextDueISO: '2026-01-31T00:00:00+01:00',
    });
    expect(reserveCentsPerMonth(premium, JANUARY_6)).toBe(60_000);
  });

  it('reserves nothing for expected income', () => {
    const salary = mockCashSchedule({ amountCents: 350_000 });
    expect(reserveCentsPerMonth(salary, JANUARY_6)).toBe(0);
  });
});

describe('dueStatus', () => {
  it('separates upcoming, due this month, and overdue', () => {
    expect(
      dueStatus(
        mockCashSchedule({ nextDueISO: '2026-03-01T00:00:00+01:00' }),
        JANUARY_6
      )
    ).toBe('upcoming');
    expect(
      dueStatus(
        mockCashSchedule({ nextDueISO: '2026-01-20T00:00:00+01:00' }),
        JANUARY_6
      )
    ).toBe('due');
    expect(
      dueStatus(
        mockCashSchedule({ nextDueISO: '2026-01-02T00:00:00+01:00' }),
        JANUARY_6
      )
    ).toBe('overdue');
  });
});

describe('reserveTotalCents and dueThisMonthCents', () => {
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

  it('reserves for future dues and charges this month to still-due', () => {
    expect(reserveTotalCents([rent, premium], JANUARY_6)).toBe(5455);
    expect(dueThisMonthCents([rent, premium], JANUARY_6)).toBe(90_000);
  });

  it('keeps an overdue schedule committed rather than releasing it', () => {
    const late = mockCashSchedule({
      id: 's3',
      amountCents: -20_000,
      nextDueISO: '2026-01-02T00:00:00+01:00',
    });
    expect(dueThisMonthCents([late], JANUARY_6)).toBe(20_000);
  });
});

describe('amountChangesFor', () => {
  const rent = mockCashSchedule({ amountCents: -90_000 });

  it('reports a rent rise once, without touching the rule', () => {
    const booking = mockCashTransaction({
      id: 't1',
      name: 'MIETE Juni',
      amountCents: -95_000,
    });
    expect(amountChangesFor([booking], [rent])).toEqual([
      {
        scheduleId: rent.id,
        fromCents: -90_000,
        toCents: -95_000,
        transactionId: 't1',
        seenISO: booking.dateISO,
      },
    ]);
  });

  it('says nothing when the amount is unchanged', () => {
    const booking = mockCashTransaction({
      name: 'MIETE',
      amountCents: -90_000,
    });
    expect(amountChangesFor([booking], [rent])).toEqual([]);
  });

  it('claims a schedule once, so two payments are not two changes', () => {
    const first = mockCashTransaction({
      id: 't1',
      name: 'MIETE',
      amountCents: -95_000,
    });
    const second = mockCashTransaction({
      id: 't2',
      name: 'MIETE',
      amountCents: -97_000,
    });
    expect(amountChangesFor([first, second], [rent])).toHaveLength(1);
  });
});

describe('advanced', () => {
  it('moves the due date on by its own period', () => {
    const quarterly = mockCashSchedule({
      periodMonths: 3,
      nextDueISO: '2026-01-01T00:00:00+01:00',
    });
    expect(advanced(quarterly, JANUARY_6).nextDueISO).toContain('2026-04-01');
    expect(advanced(quarterly, JANUARY_6).lastSeenISO).toBe(JANUARY_6);
  });
});
