import { buildTransferLegs } from './transfer';

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe('buildTransferLegs', () => {
  it('builds a paired outflow + inflow of equal magnitude', () => {
    const [from, to] = buildTransferLegs(
      'giro',
      'savings',
      5000,
      '2026-01-10T00:00:00+01:00',
      'Sparen',
      ids()
    );
    expect(from.accountId).toBe('giro');
    expect(from.amountCents).toBe(-5000);
    expect(to.accountId).toBe('savings');
    expect(to.amountCents).toBe(5000);
  });

  it('flags both legs and shares one transferGroupId', () => {
    const [from, to] = buildTransferLegs('a', 'b', 5000, 'd', 'x', ids());
    expect(from.isTransfer).toBe(true);
    expect(to.isTransfer).toBe(true);
    expect(from.transferGroupId).toBe(to.transferGroupId);
    expect(from.id).not.toBe(to.id);
  });

  it('normalizes a negative input magnitude', () => {
    const [from, to] = buildTransferLegs('a', 'b', -5000, 'd', 'x', ids());
    expect(from.amountCents).toBe(-5000);
    expect(to.amountCents).toBe(5000);
  });
});
