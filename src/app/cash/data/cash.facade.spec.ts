import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { mockCategory } from '../../@shared/testing/test-data';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import {
  mockCashAccount,
  mockCashCategoryList,
  mockCashRule,
  mockCashState,
  mockCashTransaction,
} from '../testing/cash.test-data';
import { CashActions } from './cash.actions';
import { CashFacade } from './cash.facade';

describe('CashFacade', () => {
  let facade: CashFacade;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const giro = mockCashAccount({ id: 'a1', openingBalanceCents: 10_000 });
  const card = mockCashAccount({
    id: 'a2',
    name: 'Karte',
    kind: 'creditcard',
    openingBalanceCents: 0,
  });
  const spend = mockCashTransaction({
    id: 't1',
    accountId: 'a1',
    amountCents: -2500,
    categoryId: 'c1',
  });
  const income = mockCashTransaction({
    id: 't2',
    accountId: 'a2',
    amountCents: 5000,
  });

  const ledger = mockCashState({
    accounts: [giro, card],
    transactions: [spend, income],
    categories: mockCashCategoryList({
      items: [mockCategory({ id: 'c1', name: 'Lebensmittel' })],
    }),
    rules: [mockCashRule({ id: 'r1' })],
  });

  const setup = (state = mockCashState()) => {
    TestBed.configureTestingModule({
      providers: [provideTestingProviders({ cash: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    facade = TestBed.inject(CashFacade);
  };

  it('exposes the seeded ledger through its signals', () => {
    setup(ledger);

    expect(facade.accounts().map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(facade.transactions().map((t) => t.id)).toEqual(['t1', 't2']);
    expect(facade.categories().map((c) => c.name)).toEqual(['Lebensmittel']);
    expect(facade.rules().map((r) => r.id)).toEqual(['r1']);
  });

  it('derives per-account balances and the net worth across them', () => {
    setup(ledger);

    expect(facade.accountBalances()).toEqual({ a1: 7500, a2: 5000 });
    expect(facade.netWorthCents()).toBe(12_500);
    expect(facade.accountsWithBalances().map((a) => a.balanceCents)).toEqual([
      7500, 5000,
    ]);
  });

  it('reads a single account and its ledger by route id', () => {
    setup(ledger);

    expect(facade.accountById('a2')()?.name).toBe('Karte');
    expect(facade.accountById('gone')()).toBeUndefined();
    expect(
      facade
        .transactionsForAccount('a2')()
        .map((t) => t.id)
    ).toEqual(['t2']);
  });

  it('reads the transactions filed under one category', () => {
    setup(ledger);

    expect(
      facade
        .transactionsForCategory('c1')()
        .map((t) => t.id)
    ).toEqual(['t1']);
    expect(facade.transactionsForCategory('c2')()).toEqual([]);
  });

  // One command per entity group: the risk in a 20-method pass-through facade is
  // a method wired to the neighbouring action creator.
  it('dispatches one command per entity group', () => {
    setup(ledger);

    facade.addAccount(giro);
    facade.removeTransaction('t1');
    facade.addCategory(mockCategory({ id: 'c2' }));
    facade.reorderRules(['r2', 'r1']);

    expect(dispatch).toHaveBeenCalledWith(CashActions.addAccount(giro));
    expect(dispatch).toHaveBeenCalledWith(CashActions.removeTransaction('t1'));
    expect(dispatch).toHaveBeenCalledWith(
      CashActions.addCategory(mockCategory({ id: 'c2' }))
    );
    expect(dispatch).toHaveBeenCalledWith(
      CashActions.reorderRules(['r2', 'r1'])
    );
  });

  // Same-typed positional arguments: a swap would compile and silently reconcile
  // the wrong way round.
  it('keeps the argument order of the multi-argument commands', () => {
    setup(ledger);

    facade.setTransactionCategory('t1', 'c1', true);
    facade.reconcileTransaction('manual-1', 'imported-1');
    facade.bookTransfer(spend, income);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.setTransactionCategory.type,
        id: 't1',
        categoryId: 'c1',
        manual: true,
      })
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.reconcileTransaction.type,
        manualId: 'manual-1',
        importedId: 'imported-1',
      })
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.bookTransfer.type,
        fromLeg: spend,
        toLeg: income,
      })
    );
  });

  it('publishes the apply-rules result on the shared toast contract', () => {
    setup(ledger);

    facade.reportRulesApplied(3);

    expect(dispatch).toHaveBeenCalledWith(
      NotificationsActions.toast({
        key: 'cash.rules.apply-result',
        parameters: { count: 3 },
        color: 'medium',
      })
    );
  });
});
