import { CashActions } from './cash.actions';
import { cashReducer, initialState } from './cash.reducer';
import {
  mockCashAccount,
  mockCashCategoryList,
  mockCashRule,
  mockCashState,
  mockCashTransaction,
} from '../testing/cash.test-data';
import { mockCategory } from '../../@shared/testing/test-data';

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

  it('sets a transaction category id and flags it as manual', () => {
    const txn = mockCashTransaction({ id: 't1', categoryId: 'household' });
    const start = mockCashState({ transactions: [txn] });
    const state = cashReducer(
      start,
      CashActions.setTransactionCategory('t1', 'rent', true)
    );
    expect(state.transactions[0].categoryId).toBe('rent');
    expect(state.transactions[0].categoryManual).toBe(true);
  });

  it('re-files a whole rule run in one pass, clearing the manual flag', () => {
    const start = mockCashState({
      transactions: [
        mockCashTransaction({ id: 't1' }),
        mockCashTransaction({ id: 't2', categoryId: 'fun' }),
        mockCashTransaction({ id: 't3', categoryId: 'rent' }),
      ],
    });

    const state = cashReducer(
      start,
      CashActions.recategorizeTransactions([
        { transactionId: 't1', categoryId: 'household' },
        { transactionId: 't2', categoryId: undefined },
      ])
    );

    expect(
      state.transactions.map((t) => [t.id, t.categoryId, t.categoryManual])
    ).toEqual([
      ['t1', 'household', false],
      ['t2', undefined, false],
      ['t3', 'rent', undefined],
    ]);
    expect(state.transactions[2]).toBe(start.transactions[2]);
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

    const removed = cashReducer(booked, CashActions.removeTransaction('f'));
    expect(removed.transactions).toHaveLength(0);
  });

  it('reconciles a pending manual entry into an imported survivor', () => {
    const manual = mockCashTransaction({
      id: 'm1',
      source: 'manual',
      status: 'pending',
      categoryId: 'restaurant',
      categoryManual: true,
    });
    const imported = mockCashTransaction({ id: 'i1', source: 'imported' });
    const start = mockCashState({ transactions: [manual, imported] });
    const state = cashReducer(
      start,
      CashActions.reconcileTransaction('m1', 'i1')
    );
    const m = state.transactions.find((t) => t.id === 'm1')!;
    const index = state.transactions.find((t) => t.id === 'i1')!;
    expect(m.matchedTxnId).toBe('i1');
    expect(m.status).toBe('confirmed');
    expect(index.categoryId).toBe('restaurant');
    expect(index.categoryManual).toBe(true);
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

  it('adds a pre-minted category once (dedupe by id/name) and removes it by id', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const added = cashReducer(initialState, CashActions.addCategory(rent));
    const again = cashReducer(added, CashActions.addCategory(rent));
    expect(again).toBe(added);
    expect(again.categories.items).toEqual([rent]);

    const removed = cashReducer(again, CashActions.removeCategory('rent'));
    expect(removed.categories.items).toEqual([]);
  });

  it('removing a category by id clears the id off the transactions that carry it', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const food = mockCategory({ id: 'food', name: 'Food' });
    const tagged = mockCashTransaction({
      id: 't1',
      categoryId: 'rent',
      categoryManual: true,
    });
    const other = mockCashTransaction({ id: 't2', categoryId: 'food' });
    const start = mockCashState({
      categories: mockCashCategoryList({ items: [rent, food] }),
      transactions: [tagged, other],
    });
    const state = cashReducer(start, CashActions.removeCategory('rent'));
    expect(state.categories.items).toEqual([food]);
    const t1 = state.transactions.find((t) => t.id === 't1')!;
    expect(t1.categoryId).toBeUndefined();
    expect(t1.categoryManual).toBeUndefined();
    expect(state.transactions.find((t) => t.id === 't2')!.categoryId).toBe(
      'food'
    );
  });

  it('removing a category drops the rules that assigned it', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const food = mockCategory({ id: 'food', name: 'Food' });
    const start = mockCashState({
      categories: mockCashCategoryList({ items: [rent, food] }),
      rules: [
        mockCashRule({ id: 'r1', categoryId: 'rent' }),
        mockCashRule({ id: 'r2', categoryId: 'food' }),
      ],
    });

    const state = cashReducer(start, CashActions.removeCategory('rent'));

    expect(state.rules.map((rule) => rule.id)).toEqual(['r2']);
  });

  it('prunes rules orphaned by an older build when hydrating', () => {
    const food = mockCategory({ id: 'food', name: 'Food' });
    const stored = mockCashState({
      categories: mockCashCategoryList({ items: [food] }),
      rules: [
        mockCashRule({ id: 'r1', categoryId: 'gone' }),
        mockCashRule({ id: 'r2', categoryId: 'food' }),
      ],
    });

    const state = cashReducer(mockCashState(), CashActions.loaded(stored));

    expect(state.rules.map((rule) => rule.id)).toEqual(['r2']);
  });

  it('keeps the hydrated object identity when no rule is orphaned', () => {
    const food = mockCategory({ id: 'food', name: 'Food' });
    const stored = mockCashState({
      categories: mockCashCategoryList({ items: [food] }),
      rules: [mockCashRule({ id: 'r2', categoryId: 'food' })],
    });

    expect(cashReducer(mockCashState(), CashActions.loaded(stored))).toBe(
      stored
    );
  });

  it('renaming a category is O(1) on the catalog — id-referencing txns and rules are untouched', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const food = mockCategory({ id: 'food', name: 'Food' });
    const txn = mockCashTransaction({ id: 't1', categoryId: 'rent' });
    const rule = mockCashRule({ id: 'r1', categoryId: 'rent' });
    const start = mockCashState({
      categories: mockCashCategoryList({ items: [rent, food] }),
      transactions: [txn],
      rules: [rule],
    });
    const state = cashReducer(
      start,
      CashActions.updateCategory('rent', 'Housing')
    );
    expect(state.categories.items).toEqual([
      { id: 'rent', name: 'Housing' },
      food,
    ]);
    expect(state.transactions[0].categoryId).toBe('rent');
    expect(state.rules[0].categoryId).toBe('rent');
  });

  it('renaming a category onto an existing name merges — remaps txn + rule ids to the survivor', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const food = mockCategory({ id: 'food', name: 'Food' });
    const start = mockCashState({
      categories: mockCashCategoryList({ items: [rent, food] }),
      transactions: [mockCashTransaction({ id: 't1', categoryId: 'rent' })],
      rules: [mockCashRule({ id: 'r1', categoryId: 'rent' })],
    });
    const state = cashReducer(
      start,
      CashActions.updateCategory('rent', 'Food')
    );
    expect(state.categories.items).toEqual([food]);
    expect(state.transactions[0].categoryId).toBe('food');
    expect(state.rules[0].categoryId).toBe('food');
  });

  it('adds, updates and removes filter rules', () => {
    const rule = mockCashRule({ id: 'r1' });
    const added = cashReducer(initialState, CashActions.addRule(rule));
    expect(added.rules).toEqual([rule]);

    const updated = cashReducer(
      added,
      CashActions.updateRule({ ...rule, categoryId: 'food' })
    );
    expect(updated.rules[0].categoryId).toBe('food');

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

  it('keeps a rule a partial id list omits instead of dropping it', () => {
    const start = mockCashState({
      rules: [
        mockCashRule({ id: 'a', order: 0 }),
        mockCashRule({ id: 'b', order: 1 }),
        mockCashRule({ id: 'c', order: 2 }),
      ],
    });
    const state = cashReducer(start, CashActions.reorderRules(['b', 'a']));
    expect(state.rules.map((r) => r.id)).toEqual(['b', 'a', 'c']);
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
