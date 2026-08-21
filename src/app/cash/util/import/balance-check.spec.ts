import { CashTransaction } from '../../model/transaction.types';
import { balanceDifferenceCents, lastEntryDateISO } from './balance-check';

const txn = (overrides: Partial<CashTransaction> = {}): CashTransaction => ({
  id: 'txn-1',
  name: 'booking',
  accountId: 'giro',
  dateISO: '2026-01-06T00:00:00+01:00',
  amountCents: -1000,
  source: 'imported',
  status: 'confirmed',
  ...overrides,
});

describe('balanceDifferenceCents', () => {
  it('reports zero when the derived balance matches the bank', () => {
    const difference = balanceDifferenceCents(
      9000,
      '2026-01-31',
      'giro',
      10_000,
      [txn()]
    );
    expect(difference).toBe(0);
  });

  it('reports what is missing when a booking never arrived', () => {
    const difference = balanceDifferenceCents(
      8500,
      '2026-01-31',
      'giro',
      10_000,
      [txn()]
    );
    expect(difference).toBe(-500);
  });

  it('ignores a row dated after the statement closed', () => {
    const later = txn({ id: 'txn-2', dateISO: '2026-02-03T00:00:00+01:00' });
    expect(
      balanceDifferenceCents(9000, '2026-01-31', 'giro', 10_000, [txn(), later])
    ).toBe(0);
  });

  it('ignores another account and a reconciled leg', () => {
    const other = txn({ id: 'txn-2', accountId: 'savings' });
    const reconciled = txn({ id: 'txn-3', matchedTxnId: 'txn-1' });
    expect(
      balanceDifferenceCents(9000, '2026-01-31', 'giro', 10_000, [
        txn(),
        other,
        reconciled,
      ])
    ).toBe(0);
  });
});

describe('lastEntryDateISO', () => {
  it('takes the latest date, whatever order the rows arrive in', () => {
    expect(
      lastEntryDateISO([
        { dateISO: '2026-01-06' },
        { dateISO: '2026-01-31' },
        { dateISO: '2026-01-12' },
      ])
    ).toBe('2026-01-31');
  });

  it('has no answer for an empty statement', () => {
    expect(lastEntryDateISO([])).toBeUndefined();
  });
});
