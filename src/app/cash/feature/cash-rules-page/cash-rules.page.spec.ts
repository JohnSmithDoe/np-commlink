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
    const nordkauf = mockCashRule({ id: 'r1', categoryId: 'cat-stuff' });
    setup(
      mockCashState({
        rules: [nordkauf],
        transactions: [
          mockCashTransaction({ id: 't-new', name: 'NORDKAUF SAGT DANKE' }),
          mockCashTransaction({
            id: 't-filed',
            name: 'NORDKAUF CITY',
            categoryIds: ['cat-stuff'],
          }),
          mockCashTransaction({
            id: 't-manual',
            name: 'NORDKAUF MARKT',
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
          mockCashTransaction({ id: 't1', name: 'STROMWERK NEUSTADT' }),
        ],
      })
    );

    component.applyRules();

    expect(recategorizations()).toEqual([]);
    expect(reportRulesApplied).toHaveBeenCalledWith(0);
  });

  it('hands the shared list the arrangement, not the alphabet', () => {
    setup(
      mockCashState({
        rules: [
          mockCashRule({ id: 'r3', name: 'Aldi', order: 2 }),
          mockCashRule({ id: 'r1', name: 'Zoo', order: 0 }),
          mockCashRule({ id: 'r2', name: 'Miete', order: 1 }),
        ],
      })
    );

    expect(component.facade.items().map((rule) => rule.id)).toEqual([
      'r1',
      'r2',
      'r3',
    ]);
  });

  it('re-prioritises on a drop', () => {
    setup(mockCashState({ rules: [mockCashRule({ id: 'r1', order: 0 })] }));

    component.facade.reorder(['r1', 'r3', 'r2']);

    expect(dispatch).toHaveBeenCalledWith(
      CashRulesActions.reorder(['r1', 'r3', 'r2'])
    );
  });

  it('asks for a blank rule editor, ordered after the last rule', () => {
    setup(mockCashState({ rules: [mockCashRule({ id: 'r1', order: 4 })] }));

    component.facade.showCreateDialog();

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

  it('offers no sort, so the shared toolbar never renders', () => {
    setup(mockCashState({ rules: [mockCashRule({ id: 'r1' })] }));

    component.facade.setSortMode('name');

    expect(component.facade.hasToolbar()).toBe(false);
    expect(component.facade.searchable()).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
