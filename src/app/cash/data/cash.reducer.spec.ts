import { CashActions } from './cash.actions';
import { cashReducer, initialState } from './cash.reducer';
import {
  mockCashAccount,
  mockCashRule,
  mockCashState,
  mockCashTransaction,
} from '../testing/cash.test-data';

describe('cashReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = cashReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an account', () => {
    const account = mockCashAccount();
    const state = cashReducer(initialState, CashActions.addAccount(account));
    expect(state.accounts).toEqual([account]);
  });

  it('updates an existing account in place', () => {
    const account = mockCashAccount({ id: 'a', name: 'Giro' });
    const start = mockCashState({ accounts: [account] });
    const state = cashReducer(
      start,
      CashActions.updateAccount({ ...account, name: 'Girokonto' })
    );
    expect(state.accounts).toHaveLength(1);
    expect(state.accounts[0].name).toBe('Girokonto');
  });

  it('removes an account and cascades its transactions', () => {
    const account = mockCashAccount({ id: 'a' });
    const own = mockCashTransaction({ id: 't1', accountId: 'a' });
    const other = mockCashTransaction({ id: 't2', accountId: 'b' });
    const start = mockCashState({
      accounts: [account],
      transactions: [own, other],
    });
    const state = cashReducer(start, CashActions.removeAccount('a'));
    expect(state.accounts).toHaveLength(0);
    expect(state.transactions.map((t) => t.id)).toEqual(['t2']);
  });

  it('adds, updates and removes transactions', () => {
    const txn = mockCashTransaction({ id: 't1', amountCents: -500 });
    const added = cashReducer(initialState, CashActions.addTransaction(txn));
    expect(added.transactions).toEqual([txn]);

    const updated = cashReducer(
      added,
      CashActions.updateTransaction({ ...txn, amountCents: -750 })
    );
    expect(updated.transactions[0].amountCents).toBe(-750);

    const removed = cashReducer(updated, CashActions.removeTransaction('t1'));
    expect(removed.transactions).toHaveLength(0);
  });

  it('appends a batch of imported transactions in one action', () => {
    const existing = mockCashTransaction({ id: 't0' });
    const start = mockCashState({ transactions: [existing] });
    const batch = [
      mockCashTransaction({ id: 'i1', source: 'imported' }),
      mockCashTransaction({ id: 'i2', source: 'imported' }),
    ];
    const state = cashReducer(start, CashActions.importTransactions(batch));
    expect(state.transactions.map((t) => t.id)).toEqual(['t0', 'i1', 'i2']);
  });

  it('sets a transaction category and flags it as manual', () => {
    const txn = mockCashTransaction({ id: 't1', category: 'groceries' });
    const start = mockCashState({ transactions: [txn] });
    const state = cashReducer(
      start,
      CashActions.setTransactionCategory('t1', 'rent', true)
    );
    expect(state.transactions[0].category).toBe('rent');
    expect(state.transactions[0].categoryManual).toBe(true);
  });

  it('books both legs of a transfer and deletes the group as a unit', () => {
    const fromLeg = mockCashTransaction({
      id: 'f',
      accountId: 'giro',
      amountCents: -5000,
      isTransfer: true,
      transferGroupId: 'g1',
    });
    const toLeg = mockCashTransaction({
      id: 't',
      accountId: 'savings',
      amountCents: 5000,
      isTransfer: true,
      transferGroupId: 'g1',
    });
    const booked = cashReducer(
      initialState,
      CashActions.bookTransfer(fromLeg, toLeg)
    );
    expect(booked.transactions.map((t) => t.id)).toEqual(['f', 't']);

    // removing either leg removes the whole group
    const removed = cashReducer(booked, CashActions.removeTransaction('f'));
    expect(removed.transactions).toHaveLength(0);
  });

  it('reconciles a pending manual entry into an imported survivor', () => {
    const manual = mockCashTransaction({
      id: 'm1',
      source: 'manual',
      status: 'pending',
      category: 'restaurant',
      categoryManual: true,
    });
    const imported = mockCashTransaction({ id: 'i1', source: 'imported' });
    const start = mockCashState({ transactions: [manual, imported] });
    const state = cashReducer(
      start,
      CashActions.reconcileTransaction('m1', 'i1')
    );
    const m = state.transactions.find((t) => t.id === 'm1')!;
    const i = state.transactions.find((t) => t.id === 'i1')!;
    expect(m.matchedTxnId).toBe('i1');
    expect(m.status).toBe('confirmed');
    // the hand-set category carried onto the survivor
    expect(i.category).toBe('restaurant');
    expect(i.categoryManual).toBe(true);
  });

  it('un-reconciles a reconciled leg back to pending (detach)', () => {
    const manual = mockCashTransaction({
      id: 'm1',
      source: 'manual',
      status: 'confirmed',
      matchedTxnId: 'i1',
    });
    const imported = mockCashTransaction({ id: 'i1', source: 'imported' });
    const start = mockCashState({ transactions: [manual, imported] });
    const state = cashReducer(start, CashActions.unreconcileTransaction('m1'));
    const m = state.transactions.find((t) => t.id === 'm1')!;
    expect(m.matchedTxnId).toBeUndefined();
    expect(m.status).toBe('pending');
  });

  it('adds a category once (no duplicates) and removes it', () => {
    const added = cashReducer(initialState, CashActions.addCategory('rent'));
    const again = cashReducer(added, CashActions.addCategory('rent'));
    expect(again).toBe(added);
    expect(again.categories).toEqual(['rent']);

    const removed = cashReducer(again, CashActions.removeCategory('rent'));
    expect(removed.categories).toEqual([]);
  });

  it('adds, updates and removes filter rules', () => {
    const rule = mockCashRule({ id: 'r1' });
    const added = cashReducer(initialState, CashActions.addRule(rule));
    expect(added.rules).toEqual([rule]);

    const updated = cashReducer(
      added,
      CashActions.updateRule({ ...rule, category: 'food' })
    );
    expect(updated.rules[0].category).toBe('food');

    const removed = cashReducer(updated, CashActions.removeRule('r1'));
    expect(removed.rules).toHaveLength(0);
  });

  it('reorders rules and reassigns their order index', () => {
    const start = mockCashState({
      rules: [
        mockCashRule({ id: 'a', order: 0 }),
        mockCashRule({ id: 'b', order: 1 }),
        mockCashRule({ id: 'c', order: 2 }),
      ],
    });
    const state = cashReducer(start, CashActions.reorderRules(['c', 'a', 'b']));
    expect(state.rules.map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(state.rules.map((r) => r.order)).toEqual([0, 1, 2]);
  });

  it('hydrates from a loaded slice', () => {
    const state = cashReducer(
      initialState,
      CashActions.loaded(mockCashState({ accounts: [mockCashAccount()] }))
    );
    expect(state.accounts).toHaveLength(1);
  });

  it('falls back to current state when the loaded cash slice is absent', () => {
    const state = cashReducer(initialState, CashActions.loaded(null));
    expect(state).toBe(initialState);
  });
});
