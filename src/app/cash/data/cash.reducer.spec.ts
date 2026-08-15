import { CashActions } from './cash.actions';
import { CashAccountsActions } from './accounts/cash-accounts.actions';
import { CashCategoriesActions } from './categories/cash-categories.actions';
import { CashRulesActions } from './rules/cash-rules.actions';
import { CashTransactionsActions } from './transactions/cash-transactions.actions';
import { cashReducer } from './cash.reducer';
import {
  mockCashAccount,
  mockCashCategoryList,
  mockCashRule,
  mockCashState,
  mockCashTransaction,
} from '../testing/cash.test-data';
import { mockCategory } from '../../@shared/testing/test-data';
import { categoryIdOf } from '../util/cash-category.utils';

const initialState = mockCashState();

describe('cashReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = cashReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an account', () => {
    const account = mockCashAccount();
    const state = cashReducer(
      initialState,
      CashAccountsActions.addItem(account)
    );
    expect(state.accounts.items).toEqual([account]);
  });

  it('updates an existing account in place', () => {
    const account = mockCashAccount({ id: 'a', name: 'Giro' });
    const start = mockCashState({ accounts: [account] });
    const state = cashReducer(
      start,
      CashAccountsActions.updateItem({ ...account, name: 'Girokonto' })
    );
    expect(state.accounts.items).toHaveLength(1);
    expect(state.accounts.items[0].name).toBe('Girokonto');
  });

  it('removes an account and cascades its transactions', () => {
    const account = mockCashAccount({ id: 'a' });
    const own = mockCashTransaction({ id: 't1', accountId: 'a' });
    const other = mockCashTransaction({ id: 't2', accountId: 'b' });
    const start = mockCashState({
      accounts: [account],
      transactions: [own, other],
    });
    const state = cashReducer(start, CashAccountsActions.removeItem(account));
    expect(state.accounts.items).toHaveLength(0);
    expect(state.transactions.items.map((t) => t.id)).toEqual(['t2']);
  });

  it('adds, updates and removes transactions', () => {
    const txn = mockCashTransaction({ id: 't1', amountCents: -500 });
    const added = cashReducer(
      initialState,
      CashTransactionsActions.addItem(txn)
    );
    expect(added.transactions.items).toEqual([txn]);

    const updated = cashReducer(
      added,
      CashTransactionsActions.updateItem({ ...txn, amountCents: -750 })
    );
    expect(updated.transactions.items[0].amountCents).toBe(-750);

    const removed = cashReducer(
      updated,
      CashTransactionsActions.removeItem(txn)
    );
    expect(removed.transactions.items).toHaveLength(0);
  });

  it('appends a batch of imported transactions in one action', () => {
    const existing = mockCashTransaction({ id: 't0' });
    const start = mockCashState({ transactions: [existing] });
    const batch = [
      mockCashTransaction({ id: 'i1', source: 'imported' }),
      mockCashTransaction({ id: 'i2', source: 'imported' }),
    ];
    const state = cashReducer(
      start,
      CashTransactionsActions.importItems(batch)
    );
    expect(state.transactions.items.map((t) => t.id)).toEqual([
      't0',
      'i1',
      'i2',
    ]);
  });

  it('sets a transaction category id and flags it as manual', () => {
    const txn = mockCashTransaction({ id: 't1', categoryIds: ['household'] });
    const start = mockCashState({ transactions: [txn] });
    const state = cashReducer(
      start,
      CashTransactionsActions.updateItem({
        ...txn,
        categoryIds: ['rent'],
        categoryManual: true,
      })
    );
    expect(categoryIdOf(state.transactions.items[0])).toBe('rent');
    expect(state.transactions.items[0].categoryManual).toBe(true);
  });

  it('re-files a whole rule run in one pass, clearing the manual flag', () => {
    const start = mockCashState({
      transactions: [
        mockCashTransaction({ id: 't1' }),
        mockCashTransaction({ id: 't2', categoryIds: ['fun'] }),
        mockCashTransaction({ id: 't3', categoryIds: ['rent'] }),
      ],
    });

    const state = cashReducer(
      start,
      CashTransactionsActions.recategorize([
        { transactionId: 't1', categoryId: 'household' },
        { transactionId: 't2', categoryId: undefined },
      ])
    );

    expect(
      state.transactions.items.map((t) => [
        t.id,
        categoryIdOf(t),
        t.categoryManual,
      ])
    ).toEqual([
      ['t1', 'household', false],
      ['t2', undefined, false],
      ['t3', 'rent', undefined],
    ]);
    expect(state.transactions.items[2]).toBe(start.transactions.items[2]);
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
      CashTransactionsActions.bookTransfer(fromLeg, toLeg)
    );
    expect(booked.transactions.items.map((t) => t.id)).toEqual(['f', 't']);

    const removed = cashReducer(
      booked,
      CashTransactionsActions.removeItem(fromLeg)
    );
    expect(removed.transactions.items).toHaveLength(0);
  });

  it('reconciles a pending manual entry into an imported survivor', () => {
    const manual = mockCashTransaction({
      id: 'm1',
      source: 'manual',
      status: 'pending',
      categoryIds: ['restaurant'],
      categoryManual: true,
    });
    const imported = mockCashTransaction({ id: 'i1', source: 'imported' });
    const start = mockCashState({ transactions: [manual, imported] });
    const state = cashReducer(
      start,
      CashTransactionsActions.reconcile('m1', 'i1')
    );
    const m = state.transactions.items.find((t) => t.id === 'm1')!;
    const index = state.transactions.items.find((t) => t.id === 'i1')!;
    expect(m.matchedTxnId).toBe('i1');
    expect(m.status).toBe('confirmed');
    expect(categoryIdOf(index)).toBe('restaurant');
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
    const state = cashReducer(start, CashTransactionsActions.unreconcile('m1'));
    const m = state.transactions.items.find((t) => t.id === 'm1')!;
    expect(m.matchedTxnId).toBeUndefined();
    expect(m.status).toBe('pending');
  });

  it('adds a pre-minted category once (dedupe by id/name) and removes it by id', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const added = cashReducer(
      initialState,
      CashCategoriesActions.addItem(rent)
    );
    const again = cashReducer(added, CashCategoriesActions.addItem(rent));
    expect(again).toBe(added);
    expect(again.categories.items).toEqual([rent]);

    const removed = cashReducer(again, CashCategoriesActions.removeItem(rent));
    expect(removed.categories.items).toEqual([]);
  });

  it('removing a category by id clears the id off the transactions that carry it', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const food = mockCategory({ id: 'food', name: 'Food' });
    const tagged = mockCashTransaction({
      id: 't1',
      categoryIds: ['rent'],
      categoryManual: true,
    });
    const other = mockCashTransaction({ id: 't2', categoryIds: ['food'] });
    const start = mockCashState({
      categories: mockCashCategoryList({ items: [rent, food] }),
      transactions: [tagged, other],
    });
    const state = cashReducer(start, CashCategoriesActions.removeItem(rent));
    expect(state.categories.items).toEqual([food]);
    const t1 = state.transactions.items.find((t) => t.id === 't1')!;
    expect(categoryIdOf(t1)).toBeUndefined();
    expect(t1.categoryManual).toBeUndefined();
    expect(
      categoryIdOf(state.transactions.items.find((t) => t.id === 't2')!)
    ).toBe('food');
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

    const state = cashReducer(start, CashCategoriesActions.removeItem(rent));

    expect(state.rules.items.map((rule) => rule.id)).toEqual(['r2']);
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

    expect(state.rules.items.map((rule) => rule.id)).toEqual(['r2']);
  });

  it('keeps every stored row when no rule is orphaned', () => {
    const food = mockCategory({ id: 'food', name: 'Food' });
    const rule = mockCashRule({ id: 'r2', categoryId: 'food' });
    const stored = mockCashState({
      categories: mockCashCategoryList({ items: [food] }),
      rules: [rule],
    });

    const state = cashReducer(mockCashState(), CashActions.loaded(stored));

    expect(state.rules.items).toEqual([rule]);
    expect(state.categories.items).toEqual([food]);
  });

  it('drops a search and a filter on hydrate — both are transient, neither is stored', () => {
    const stored = mockCashState({ transactions: [mockCashTransaction()] });
    const withTransients = {
      ...stored,
      transactions: {
        ...stored.transactions,
        searchQuery: 'REWE',
        filterBy: 'groceries',
      },
    };

    const state = cashReducer(
      mockCashState(),
      CashActions.loaded(withTransients)
    );

    expect(state.transactions.searchQuery).toBeUndefined();
    expect(state.transactions.filterBy).toBeUndefined();
    expect(state.transactions.items).toHaveLength(1);
  });

  it('renaming a category is O(1) on the catalog — id-referencing txns and rules are untouched', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const food = mockCategory({ id: 'food', name: 'Food' });
    const txn = mockCashTransaction({ id: 't1', categoryIds: ['rent'] });
    const rule = mockCashRule({ id: 'r1', categoryId: 'rent' });
    const start = mockCashState({
      categories: mockCashCategoryList({ items: [rent, food] }),
      transactions: [txn],
      rules: [rule],
    });
    const state = cashReducer(
      start,
      CashCategoriesActions.updateItem({ id: 'rent', name: 'Housing' })
    );
    expect(state.categories.items).toEqual([
      { id: 'rent', name: 'Housing' },
      food,
    ]);
    expect(categoryIdOf(state.transactions.items[0])).toBe('rent');
    expect(state.rules.items[0].categoryId).toBe('rent');
  });

  it('renaming a category onto an existing name merges — remaps txn + rule ids to the survivor', () => {
    const rent = mockCategory({ id: 'rent', name: 'Rent' });
    const food = mockCategory({ id: 'food', name: 'Food' });
    const start = mockCashState({
      categories: mockCashCategoryList({ items: [rent, food] }),
      transactions: [mockCashTransaction({ id: 't1', categoryIds: ['rent'] })],
      rules: [mockCashRule({ id: 'r1', categoryId: 'rent' })],
    });
    const state = cashReducer(
      start,
      CashCategoriesActions.updateItem({ id: 'rent', name: 'Food' })
    );
    expect(state.categories.items).toEqual([food]);
    expect(categoryIdOf(state.transactions.items[0])).toBe('food');
    expect(state.rules.items[0].categoryId).toBe('food');
  });

  it('adds, updates and removes filter rules', () => {
    const rule = mockCashRule({ id: 'r1' });
    const added = cashReducer(initialState, CashRulesActions.addItem(rule));
    expect(added.rules.items).toEqual([rule]);

    const updated = cashReducer(
      added,
      CashRulesActions.updateItem({ ...rule, categoryId: 'food' })
    );
    expect(updated.rules.items[0].categoryId).toBe('food');

    const removed = cashReducer(updated, CashRulesActions.removeItem(rule));
    expect(removed.rules.items).toHaveLength(0);
  });

  it('reorders rules and reassigns their order index', () => {
    const start = mockCashState({
      rules: [
        mockCashRule({ id: 'a', order: 0 }),
        mockCashRule({ id: 'b', order: 1 }),
        mockCashRule({ id: 'c', order: 2 }),
      ],
    });
    const state = cashReducer(start, CashRulesActions.reorder(['c', 'a', 'b']));
    expect(state.rules.items.map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(state.rules.items.map((r) => r.order)).toEqual([0, 1, 2]);
  });

  it('keeps a rule a partial id list omits instead of dropping it', () => {
    const start = mockCashState({
      rules: [
        mockCashRule({ id: 'a', order: 0 }),
        mockCashRule({ id: 'b', order: 1 }),
        mockCashRule({ id: 'c', order: 2 }),
      ],
    });
    const state = cashReducer(start, CashRulesActions.reorder(['b', 'a']));
    expect(state.rules.items.map((r) => r.id)).toEqual(['b', 'a', 'c']);
    expect(state.rules.items.map((r) => r.order)).toEqual([0, 1, 2]);
  });

  it('hydrates from a loaded slice', () => {
    const state = cashReducer(
      initialState,
      CashActions.loaded(mockCashState({ accounts: [mockCashAccount()] }))
    );
    expect(state.accounts.items).toHaveLength(1);
  });

  it('falls back to current state when the loaded cash slice is absent', () => {
    const state = cashReducer(initialState, CashActions.loaded(null));
    expect(state).toEqual(initialState);
  });
});
