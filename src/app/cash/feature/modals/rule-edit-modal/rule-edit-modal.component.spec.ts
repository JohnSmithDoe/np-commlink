import { setupModalSpec } from '../../../../@shared/testing/modal-spec';
import { mockCashRule, mockCashState } from '../../../testing/cash.test-data';
import { CashActions } from '../../../data';
import { CashRuleEditModalComponent } from './rule-edit-modal.component';

describe('CashRuleEditModalComponent', () => {
  let component: CashRuleEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockCashState()) => {
    ({ component, dispatch, dismiss } = setupModalSpec(
      CashRuleEditModalComponent,
      { cash: state }
    ));
  };

  // What the `[formField]`-bound value input does when someone types into row
  // `index` — the field tree writes straight back into the draft.
  const typeValue = (index: number, value: string) =>
    component.patch({
      conditions: component
        .draft()
        .conditions.map((condition, at) =>
          at === index ? { ...condition, value } : condition
        ),
    });

  it('starts with one blank condition and cannot save yet', () => {
    setup();

    expect(component.draft().conditions).toHaveLength(1);
    expect(component.canSave()).toBe(false);
  });

  it('requires a category and a non-empty value on every condition', () => {
    setup();

    typeValue(0, 'REWE');
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

  // `matchesAmountCondition` reads an unparseable threshold as "never matches",
  // so such a rule would look armed in the list and silently never fire.
  it('refuses an amount threshold that does not parse, and flags that row', () => {
    setup();

    component.patch({ categoryId: 'cat-1' });
    component.onField(0, 'amount');
    typeValue(0, 'abc');

    expect(component.amountInvalidRows()).toEqual([true]);
    expect(component.canSave()).toBe(false);

    typeValue(0, '-25,00');

    expect(component.amountInvalidRows()).toEqual([false]);
    expect(component.canSave()).toBe(true);
  });

  it('trims condition values and mints an ordered rule on create', () => {
    setup();

    component.patch({ categoryId: 'cat-1', name: '  Groceries  ' });
    typeValue(0, '  REWE  ');
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

  // The amount matcher ignores it, so persisting it would store a flag that can
  // never apply.
  it('drops case-sensitivity from a numeric condition', () => {
    setup();

    component.patch({ categoryId: 'cat-1' });
    component.onField(0, 'amount');
    typeValue(0, '10,00');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        rule: expect.objectContaining({
          conditions: [{ field: 'amount', op: 'eq', value: '10,00' }],
        }),
      })
    );
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
    expect(component.draft().conditions).toEqual([
      {
        field: 'description',
        op: 'contains',
        value: 'REWE',
        caseSensitive: false,
      },
    ]);

    typeValue(0, 'ALDI');
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

  // The field tree projects the draft signal instead of copying it, so a reseed
  // has to reach validity too — reading canSave() first materialises the tree
  // over the blank create-mode draft, which is what would freeze a copy.
  it('re-derives validity after the draft reseeds', () => {
    setup(
      mockCashState({
        rules: [
          mockCashRule({
            id: 'r1',
            categoryId: 'cat-1',
            conditions: [
              { field: 'description', op: 'contains', value: 'REWE' },
            ],
          }),
        ],
      })
    );

    expect(component.canSave()).toBe(false);

    component.ruleId = 'r1';

    expect(component.canSave()).toBe(true);
  });

  it('dismisses without dispatching on cancel', () => {
    setup();

    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
