import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockCashRule,
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { CashActions, CashFacade } from '../../data';
import { CashRuleEditModalComponent } from '../rule-edit-modal/rule-edit-modal.component';
import { CashRulesPage } from './cash-rules.page';

describe('CashRulesPage', () => {
  let component: CashRulesPage;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let reportRulesApplied: ReturnType<typeof vi.spyOn>;
  let createModal: ReturnType<typeof vi.spyOn>;
  let present: ReturnType<typeof vi.fn>;

  const setup = (state = mockCashState()) => {
    TestBed.configureTestingModule({
      imports: [CashRulesPage, TranslateModule.forRoot()],
      providers: [provideTestingProviders({ cash: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    reportRulesApplied = vi.spyOn(
      TestBed.inject(CashFacade),
      'reportRulesApplied'
    );
    present = vi.fn();
    createModal = vi
      .spyOn(TestBed.inject(ModalController), 'create')
      .mockResolvedValue({ present } as unknown as HTMLIonModalElement);
    component = TestBed.createComponent(CashRulesPage).componentInstance;
  };

  const categorizations = () =>
    (dispatch.mock.calls as Array<[{ type: string }]>)
      .map((call) => call[0])
      .filter(
        (action) => action.type === CashActions.setTransactionCategory.type
      );

  it('files only the transactions the rules re-categorize and reports the count', () => {
    const rewe = mockCashRule({ id: 'r1', categoryId: 'cat-groceries' });
    setup(
      mockCashState({
        rules: [rewe],
        transactions: [
          mockCashTransaction({ id: 't-new', description: 'REWE SAGT DANKE' }),
          mockCashTransaction({
            id: 't-filed',
            description: 'REWE CITY',
            categoryId: 'cat-groceries',
          }),
          mockCashTransaction({
            id: 't-manual',
            description: 'REWE MARKT',
            categoryId: 'cat-fun',
            categoryManual: true,
          }),
        ],
      })
    );

    component.applyRules();

    // `manual: false` is load-bearing: a rule-assigned category must stay
    // rule-owned, or the next run would shield it as a user override.
    expect(categorizations()).toEqual([
      expect.objectContaining({
        id: 't-new',
        categoryId: 'cat-groceries',
        manual: false,
      }),
    ]);
    expect(reportRulesApplied).toHaveBeenCalledWith(1);
  });

  it('changes nothing but still reports zero when no rule matches', () => {
    setup(
      mockCashState({
        rules: [mockCashRule({ id: 'r1' })],
        transactions: [
          mockCashTransaction({ id: 't1', description: 'STADTWERKE STROM' }),
        ],
      })
    );

    component.applyRules();

    expect(categorizations()).toEqual([]);
    expect(reportRulesApplied).toHaveBeenCalledWith(0);
  });

  it('swaps a rule with its neighbour in priority order', () => {
    const first = mockCashRule({ id: 'r1', order: 0 });
    const second = mockCashRule({ id: 'r2', order: 1 });
    const third = mockCashRule({ id: 'r3', order: 2 });
    setup(mockCashState({ rules: [third, first, second] }));

    component.moveRule(third, -1);

    // The reducer rebuilds the rule list FROM these ids, so the payload must be
    // the complete order — an omitted id deletes that rule.
    expect(dispatch).toHaveBeenCalledWith(
      CashActions.reorderRules(['r1', 'r3', 'r2'])
    );
  });

  it('ignores a move past either end of the list', () => {
    const first = mockCashRule({ id: 'r1', order: 0 });
    const second = mockCashRule({ id: 'r2', order: 1 });
    setup(mockCashState({ rules: [first, second] }));

    component.moveRule(first, -1);
    component.moveRule(second, 1);

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: CashActions.reorderRules.type })
    );
  });

  it('presents a blank rule editor for a new rule', async () => {
    setup();

    await component.openNewRule();

    expect(createModal).toHaveBeenCalledWith({
      component: CashRuleEditModalComponent,
      componentProps: undefined,
    });
    expect(present).toHaveBeenCalled();
  });

  it('presents the rule editor seeded with the tapped rule', async () => {
    const rule = mockCashRule({ id: 'r1' });
    setup(mockCashState({ rules: [rule] }));

    await component.openEditRule(rule);

    expect(createModal).toHaveBeenCalledWith({
      component: CashRuleEditModalComponent,
      componentProps: { ruleId: 'r1' },
    });
    expect(present).toHaveBeenCalled();
  });
});
