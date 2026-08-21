import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { CASH_TRANSACTIONS_LIST_ID } from '../../model/cash.types';
import { CashTransaction } from '../../model/transaction.types';
import {
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { createCashTransaction } from '../../util/cash.factory';
import { EditCashTransactionDialogComponent } from './edit-cash-transaction-dialog.component';

describe('EditCashTransactionDialogComponent', () => {
  let component: EditCashTransactionDialogComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const setup = (
    seed: CashTransaction = createCashTransaction('', 'a1'),
    editMode: 'create' | 'update' = 'create',
    transactions: CashTransaction[] = []
  ) => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({ cash: mockCashState({ transactions }) }),
      ],
    });
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: CASH_TRANSACTIONS_LIST_ID, editMode });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    component = TestBed.createComponent(
      EditCashTransactionDialogComponent
    ).componentInstance;
  };

  const saved = (): CashTransaction =>
    (dispatch.mock.lastCall as unknown as [{ item: CashTransaction }])[0].item;

  it('signs the amount negative for an expense, the default for a fresh booking', () => {
    setup();

    component.form.name().value.set('Coffee');
    component.form.amountCents().value.set(350);
    component.confirm();

    expect(saved()).toMatchObject({
      accountId: 'a1',
      name: 'Coffee',
      amountCents: -350,
      source: 'manual',
      status: 'confirmed',
    });
  });

  it('signs the amount positive for an income', () => {
    setup();

    component.form.name().value.set('Salary');
    component.form.amountCents().value.set(100_000);
    component.form.direction().value.set('income');
    component.confirm();

    expect(saved().amountCents).toBe(100_000);
  });

  it('splits a stored signed amount back into a magnitude and a direction', () => {
    const txn = mockCashTransaction({ id: 't1', amountCents: -4299 });
    setup(txn, 'update', [txn]);

    expect(component.draft().amountCents).toBe(4299);
    expect(component.draft().direction).toBe('expense');
  });

  it('refuses a blank description and a zero amount', () => {
    setup();

    component.form.name().value.set(' \t ');
    component.form.amountCents().value.set(1000);
    expect(component.canSave()).toBe(false);

    component.form.name().value.set('X');
    component.form.amountCents().value.set(0);
    expect(component.canSave()).toBe(false);
  });

  it('allows a description another booking already has — a statement repeats itself', () => {
    const nordkauf = mockCashTransaction({
      id: 't1',
      name: 'NORDKAUF SAGT DANKE',
    });
    setup(createCashTransaction('', 'a1'), 'create', [nordkauf]);

    component.form.name().value.set('NORDKAUF SAGT DANKE');
    component.form.amountCents().value.set(1999);

    expect(component.canSave()).toBe(true);
  });

  it('flags a human-set category as manual so a rule re-run skips it', () => {
    setup();

    component.form.name().value.set('Coffee');
    component.form.amountCents().value.set(350);
    component.form.categoryId().value.set('cat-1');
    component.confirm();

    expect(saved().categoryIds).toEqual(['cat-1']);
    expect(saved().categoryManual).toBe(true);
  });

  it('flags a deliberately cleared category as manual too, so rules leave it alone', () => {
    const filed = mockCashTransaction({
      id: 't1',
      categoryIds: ['cat-1'],
      amountCents: -350,
    });
    setup(filed, 'update', [filed]);

    component.form.categoryId().value.set('');
    component.confirm();

    expect(saved().categoryIds).toBeUndefined();
    expect(saved().categoryManual).toBe(true);
  });

  it('leaves the category alone when only the date was corrected', () => {
    const auto = mockCashTransaction({
      id: 't1',
      categoryIds: ['cat-1'],
      amountCents: -350,
    });
    setup(auto, 'update', [auto]);

    component.form.date().value.set('2026-03-04');
    component.confirm();

    expect(saved().categoryIds).toEqual(['cat-1']);
    expect(saved().categoryManual).toBeUndefined();
  });
});
