import { mockCashAccount } from '../../testing/cash.test-data';
import {
  selectAccountById,
  selectAccountsWithBalances,
} from './cash-accounts.selector';

describe('cash account selectors', () => {
  describe('selectAccountsWithBalances', () => {
    it('carries the running balance onto each account', () => {
      const accounts = [
        mockCashAccount({ id: 'a', openingBalanceCents: 1000 }),
        mockCashAccount({ id: 'b', openingBalanceCents: 2000 }),
      ];

      expect(
        selectAccountsWithBalances
          .projector(accounts, { a: 500, b: 2000 })
          .map(({ id, balanceCents }) => [id, balanceCents])
      ).toEqual([
        ['a', 500],
        ['b', 2000],
      ]);
    });

    it('falls back to the opening balance for an account with no entry', () => {
      const account = mockCashAccount({ id: 'a', openingBalanceCents: 7000 });

      expect(
        selectAccountsWithBalances.projector([account], {})[0].balanceCents
      ).toBe(7000);
    });
  });

  describe('selectAccountById', () => {
    it('finds the named account and nothing for an unknown id', () => {
      const accounts = [
        mockCashAccount({ id: 'a', name: 'Giro' }),
        mockCashAccount({ id: 'b', name: 'Sparkonto' }),
      ];

      expect(selectAccountById('b').projector(accounts)?.name).toBe(
        'Sparkonto'
      );
      expect(selectAccountById('nope').projector(accounts)).toBeUndefined();
    });
  });
});
