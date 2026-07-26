import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { mockCashRule, mockCashState } from '../../testing/cash.test-data';
import { CashActions } from '../../data';
import { CashRuleEditModalComponent } from './rule-edit-modal.component';

describe('CashRuleEditModalComponent', () => {
  let component: CashRuleEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockCashState()) => {
    TestBed.configureTestingModule({
      imports: [CashRuleEditModalComponent, TranslateModule.forRoot()],
      providers: [provideTestingProviders({ cash: state })],
    });
    dismiss = vi
      .spyOn(TestBed.inject(ModalController), 'dismiss')
      .mockResolvedValue(true);
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      CashRuleEditModalComponent
    ).componentInstance;
  };

  it('starts with one blank condition and cannot save yet', () => {
    setup();

    expect(component.draft().conditions).toHaveLength(1);
    expect(component.canSave()).toBe(false);
  });

  it('requires a category and a non-empty value on every condition', () => {
    setup();

    component.onValue(0, 'REWE');
    expect(component.canSave()).toBe(false);

    component.patch({ categoryId: 'cat-1' });
    expect(component.canSave()).toBe(true);

    component.addCondition();
    expect(component.draft().conditions).toHaveLength(2);
    expect(component.canSave()).toBe(false);

    component.removeCondition(1);
    expect(component.canSave()).toBe(true);
  });

  // Switching field must reset the op, or an amount field could keep a string op.
  it('resets the op to the first valid one when the field changes', () => {
    setup();

    component.onField(0, 'amount');

    expect(component.draft().conditions[0]).toMatchObject({
      field: 'amount',
      op: component.opsFor('amount')[0],
    });
  });

  it('trims condition values and mints an ordered rule on create', () => {
    setup();

    component.patch({ categoryId: 'cat-1', name: '  Groceries  ' });
    component.onValue(0, '  REWE  ');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.addRule.type,
        rule: expect.objectContaining({
          name: 'Groceries',
          order: 0,
          categoryId: 'cat-1',
          conditions: [expect.objectContaining({ value: 'REWE' })],
        }),
      })
    );
    expect(dismiss).toHaveBeenCalled();
  });

  // The componentProp writes into a signal, so the draft seeds reactively — and
  // the conditions are COPIED, so a cancel can't mutate the stored rule.
  it('seeds a copy of the rule conditions and updates on confirm', () => {
    const stored = mockCashRule({
      id: 'r1',
      categoryId: 'cat-1',
      conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
    });
    setup(mockCashState({ rules: [stored] }));

    component.ruleId = 'r1';

    expect(component.isEdit()).toBe(true);
    expect(component.draft().conditions).toEqual(stored.conditions);
    expect(component.draft().conditions[0]).not.toBe(stored.conditions[0]);

    component.onValue(0, 'ALDI');
    expect(stored.conditions[0].value).toBe('REWE');

    component.confirm();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.updateRule.type,
        rule: expect.objectContaining({
          id: 'r1',
          conditions: [expect.objectContaining({ value: 'ALDI' })],
        }),
      })
    );
  });

  it('dismisses without dispatching on cancel', () => {
    setup();

    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
