import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { CASH_RULES_LIST_ID } from '../../model/cash.types';
import { CashRule } from '../../model/rule.types';
import { mockCashRule, mockCashState } from '../../testing/cash.test-data';
import { createCashRule } from '../../util/cash.factory';
import { blankCondition } from '../../util/rule-form.utils';
import { EditCashRuleDialogComponent } from './edit-cash-rule-dialog.component';

describe('EditCashRuleDialogComponent', () => {
  let component: EditCashRuleDialogComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const setup = (
    seed: CashRule = createCashRule(''),
    editMode: 'create' | 'update' = 'create',
    rules: CashRule[] = []
  ) => {
    TestBed.configureTestingModule({
      providers: [provideTestingProviders({ cash: mockCashState({ rules }) })],
    });
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: CASH_RULES_LIST_ID, editMode });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    component = TestBed.createComponent(
      EditCashRuleDialogComponent
    ).componentInstance;
  };

  const saved = (): CashRule =>
    (dispatch.mock.lastCall as unknown as [{ item: CashRule }])[0].item;

  const typeValue = (index: number, value: string) =>
    [...component.form.conditions][index].value().value.set(value);

  const fill = (value: string, categoryId = 'cat-1') => {
    typeValue(0, value);
    component.form.categoryId().value.set(categoryId);
    component.form.name().value.set('Household');
  };

  it('requires a category and a non-empty value on every condition', () => {
    setup();

    typeValue(0, 'REWE');
    component.form.name().value.set('Household');
    expect(component.canSave()).toBe(false);

    component.form.categoryId().value.set('cat-1');
    expect(component.canSave()).toBe(true);

    component.addCondition();
    expect(component.draft().conditions).toHaveLength(2);
    expect(component.canSave()).toBe(false);

    component.removeCondition(1);
    expect(component.canSave()).toBe(true);
  });

  it('resets the op to the first valid one when the field changes', () => {
    setup();

    component.onField(0, 'amount');

    expect(component.draft().conditions[0]).toMatchObject({
      field: 'amount',
      op: component.opsFor('amount')[0],
    });
  });

  it('refuses an amount threshold that does not parse, and flags that row', () => {
    setup();

    component.form.categoryId().value.set('cat-1');
    component.form.name().value.set('Household');
    component.onField(0, 'amount');
    typeValue(0, 'abc');

    expect(component.amountInvalidRows()).toEqual([true]);
    expect(component.canSave()).toBe(false);

    typeValue(0, '-25,00');

    expect(component.amountInvalidRows()).toEqual([false]);
    expect(component.canSave()).toBe(true);
  });

  it('trims condition values and keeps the order it was minted with', () => {
    setup(createCashRule('', '', 3));

    fill('  REWE  ');
    component.confirm();

    expect(saved()).toMatchObject({
      name: 'Household',
      order: 3,
      categoryId: 'cat-1',
    });
    expect(saved().conditions).toEqual([
      expect.objectContaining({ value: 'REWE' }),
    ]);
    expect(host.request()).toBeNull();
  });

  it('drops case-sensitivity from a numeric condition', () => {
    setup();

    component.form.categoryId().value.set('cat-1');
    component.form.name().value.set('Household');
    component.onField(0, 'amount');
    typeValue(0, '10,00');
    component.confirm();

    expect(saved().conditions).toEqual([
      { field: 'amount', op: 'eq', value: '10,00' },
    ]);
  });

  it('seeds a copy of the stored conditions and leaves the original alone', () => {
    const stored = mockCashRule({
      id: 'r1',
      categoryId: 'cat-1',
      conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
    });
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({ cash: mockCashState({ rules: [stored] }) }),
      ],
    });
    host = TestBed.inject(ItemDialogService);
    host.open({ item: stored, listId: CASH_RULES_LIST_ID, editMode: 'update' });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    component = TestBed.createComponent(
      EditCashRuleDialogComponent
    ).componentInstance;

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
    expect(saved()).toMatchObject({ id: 'r1' });
    expect(saved().conditions).toEqual([
      expect.objectContaining({ value: 'ALDI' }),
    ]);
  });

  it('refuses a blank name — the shared name input is the rule’s identity', () => {
    setup();

    typeValue(0, 'REWE');
    component.form.categoryId().value.set('cat-1');
    component.form.name().value.set('');

    expect(component.canSave()).toBe(false);
  });

  it('allows two rules to share a name', () => {
    const twin = mockCashRule({ id: 'r1', name: 'Household' });
    setup(createCashRule(''), 'create', [twin]);

    fill('REWE');

    expect(component.canSave()).toBe(true);
  });

  it('starts a fresh rule on one blank condition, so it cannot be saved yet', () => {
    setup();

    expect(component.draft().conditions).toEqual([blankCondition()]);
    expect(component.canSave()).toBe(false);
  });
});
