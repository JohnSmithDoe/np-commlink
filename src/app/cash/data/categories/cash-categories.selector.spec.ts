import { mockCashTransaction } from '../../testing/cash.test-data';
import { selectCashCountByCategory } from './cash-categories.selector';

describe('selectCashCountByCategory', () => {
  it('counts live transactions per category, skipping reconciled-away legs', () => {
    const counts = selectCashCountByCategory.projector([
      mockCashTransaction({ id: 't1', categoryIds: ['c1'] }),
      mockCashTransaction({ id: 't2', categoryIds: ['c1'] }),
      mockCashTransaction({
        id: 't3',
        categoryIds: ['c1'],
        matchedTxnId: 't1',
      }),
      mockCashTransaction({ id: 't4' }),
    ]);

    expect(counts.get('c1')).toBe(2);
    expect(counts.size).toBe(1);
  });
});
