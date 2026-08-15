import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { CASH_RULES_LIST_ID } from '../../model/cash.types';
import { CashRule } from '../../model/rule.types';
import {
  mockCashRule,
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import {
  CashRulesActions,
  CashRulesFacade,
  CashTransactionsActions,
} from '../../data';
import { CashRulesPage } from './cash-rules.page';

describe('CashRulesPage', () => {
  let component: CashRulesPage;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let reportRulesApplied: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockCashState()) => {
    TestBed.configureTestingModule({
      imports: [CashRulesPage],
      providers: [provideTestingProviders({ cash: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    reportRulesApplied = vi.spyOn(
      TestBed.inject(CashRulesFacade),
      'reportRulesApplied'
    );
    component = TestBed.createComponent(CashRulesPage).componentInstance;
  };

  const recategorizations = () =>
    (dispatch.mock.calls as Array<[{ type: string }]>)
      .map((call) => call[0])
      .filter(
        (action) => action.type === CashTransactionsActions.recategorize.type
      );

  it('files only the transactions the rules re-categorize and reports the count', () => {
    const rewe = mockCashRule({ id: 'r1', categoryId: 'cat-stuff' });
    setup(
      mockCashState({
        rules: [rewe],
        transactions: [
          mockCashTransaction({ id: 't-new', name: 'REWE SAGT DANKE' }),
          mockCashTransaction({
            id: 't-filed',
            name: 'REWE CITY',
            categoryIds: ['cat-stuff'],
          }),
          mockCashTransaction({
            id: 't-manual',
            name: 'REWE MARKT',
            categoryIds: ['cat-fun'],
            categoryManual: true,
          }),
        ],
      })
    );

    component.applyRules();

    expect(recategorizations()).toEqual([
      CashTransactionsActions.recategorize([
        { transactionId: 't-new', categoryId: 'cat-stuff' },
      ]),
    ]);
    expect(reportRulesApplied).toHaveBeenCalledWith(1);
  });

  it('changes nothing but still reports zero when no rule matches', () => {
    setup(
      mockCashState({
        rules: [mockCashRule({ id: 'r1' })],
        transactions: [
          mockCashTransaction({ id: 't1', name: 'STADTWERKE STROM' }),
        ],
      })
    );

    component.applyRules();

    expect(recategorizations()).toEqual([]);
    expect(reportRulesApplied).toHaveBeenCalledWith(0);
  });

  it('re-prioritises on a drop, in the order the list renders', () => {
    const first = mockCashRule({ id: 'r1', order: 0 });
    const second = mockCashRule({ id: 'r2', order: 1 });
    const third = mockCashRule({ id: 'r3', order: 2 });
    setup(mockCashState({ rules: [third, first, second] }));

    const complete = vi.fn();
    component.reorder({ detail: { from: 2, to: 1, complete } } as never);

    expect(complete).toHaveBeenCalledWith(false);
    expect(dispatch).toHaveBeenCalledWith(
      CashRulesActions.reorder(['r1', 'r3', 'r2'])
    );
  });

  it('asks for a blank rule editor, ordered after the last rule', () => {
    setup(mockCashState({ rules: [mockCashRule({ id: 'r1', order: 4 })] }));

    component.openNewRule();

    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.listId).toBe(CASH_RULES_LIST_ID);
    expect(request?.editMode).toBe('create');
    expect((request?.item as CashRule).order).toBe(5);
  });

  it('asks for the editor seeded with the tapped rule', () => {
    const rule = mockCashRule({ id: 'r1' });
    setup(mockCashState({ rules: [rule] }));

    component.openEditRule(rule);

    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.editMode).toBe('update');
    expect(request?.item.id).toBe('r1');
  });
});
