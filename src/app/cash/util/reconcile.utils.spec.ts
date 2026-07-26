import { mockCashTransaction } from '../testing/cash.test-data';
import { findReconciliationCandidates } from './reconcile.utils';

const pending = mockCashTransaction({
  id: 'm1',
  accountId: 'a',
  amountCents: -4299,
  dateISO: '2026-01-10T00:00:00+01:00',
  source: 'manual',
  status: 'pending',
});

const imported = (over = {}) =>
  mockCashTransaction({
    id: 'i1',
    accountId: 'a',
    amountCents: -4299,
    dateISO: '2026-01-11T00:00:00+01:00',
    source: 'imported',
    status: 'confirmed',
    ...over,
  });

describe('findReconciliationCandidates', () => {
  it('matches same account + equal amount within ±3 days', () => {
    const result = findReconciliationCandidates(pending, [pending, imported()]);
    expect(result.map((t) => t.id)).toEqual(['i1']);
  });

  it('excludes different amount, different account, and dates outside the window', () => {
    const all = [
      pending,
      imported({ id: 'amount', amountCents: -4300 }),
      imported({ id: 'account', accountId: 'b' }),
      imported({ id: 'faraway', dateISO: '2026-02-01T00:00:00+01:00' }),
    ];
    expect(findReconciliationCandidates(pending, all)).toEqual([]);
  });

  it('excludes imported txns already claimed as a survivor', () => {
    const already = imported({ id: 'taken' });
    const otherManual = mockCashTransaction({
      id: 'm2',
      matchedTxnId: 'taken',
    });
    expect(
      findReconciliationCandidates(pending, [pending, already, otherManual])
    ).toEqual([]);
  });

  it('returns nothing for a non-pending or already-matched transaction', () => {
    expect(
      findReconciliationCandidates({ ...pending, status: 'confirmed' }, [
        imported(),
      ])
    ).toEqual([]);
    expect(
      findReconciliationCandidates({ ...pending, matchedTxnId: 'x' }, [
        imported(),
      ])
    ).toEqual([]);
  });

  it('orders candidates by date proximity', () => {
    const near = imported({ id: 'near', dateISO: '2026-01-10T00:00:00+01:00' });
    const far = imported({ id: 'far', dateISO: '2026-01-13T00:00:00+01:00' });
    const result = findReconciliationCandidates(pending, [pending, far, near]);
    expect(result.map((t) => t.id)).toEqual(['near', 'far']);
  });
});
