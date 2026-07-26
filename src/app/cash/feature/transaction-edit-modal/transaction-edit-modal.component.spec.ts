import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { CashActions } from '../../data';
import { CashTransactionEditModalComponent } from './transaction-edit-modal.component';

describe('CashTransactionEditModalComponent', () => {
  let component: CashTransactionEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockCashState()) => {
    TestBed.configureTestingModule({
      imports: [CashTransactionEditModalComponent, TranslateModule.forRoot()],
      providers: [provideTestingProviders({ cash: state })],
    });
    dismiss = vi
      .spyOn(TestBed.inject(ModalController), 'dismiss')
      .mockResolvedValue(true);
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      CashTransactionEditModalComponent
    ).componentInstance;
  };

  // The magnitude + direction form maps onto one signed amountCents.
  it('signs the amount negative for an expense', () => {
    setup();
    component.accountId = 'a1';

    component.patch({ description: 'Coffee', amount: '3,50' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.addTransaction.type,
        transaction: expect.objectContaining({
          accountId: 'a1',
          description: 'Coffee',
          amountCents: -350,
          source: 'manual',
          status: 'confirmed',
        }),
      })
    );
    expect(dismiss).toHaveBeenCalled();
  });

  it('signs the amount positive for an income', () => {
    setup();
    component.accountId = 'a1';

    component.patch({
      description: 'Salary',
      amount: '1.000,00',
      direction: 'income',
    });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({ amountCents: 100_000 }),
      })
    );
  });

  it('rejects a non-positive or unparseable amount', () => {
    setup();

    component.patch({ description: 'X', amount: '0' });
    expect(component.amountInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.patch({ amount: 'abc' });
    expect(component.amountInvalid()).toBe(true);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses to save a cleared date rather than persisting "Invalid Date"', () => {
    // `dayjs('').format()` returns the literal string 'Invalid Date', which
    // used to reach `dateISO`: it sorts above every real date, buckets into a
    // phantom month in the report, and can never be reconciled.
    setup();

    component.patch({ description: 'X', amount: '10,00', date: '' });

    expect(component.dateInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('flags a human-set category as manual so rule re-runs skip it', () => {
    setup();
    component.accountId = 'a1';

    component.patch({
      description: 'Coffee',
      amount: '3,50',
      categoryId: 'cat-1',
    });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({
          categoryId: 'cat-1',
          categoryManual: true,
        }),
      })
    );
  });

  it('flags a deliberately cleared category as manual too, so rules leave it alone', () => {
    setup();
    component.accountId = 'a1';

    component.patch({
      description: 'Coffee',
      amount: '3,50',
      categoryId: '',
    });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({
          categoryId: undefined,
          categoryManual: true,
        }),
      })
    );
  });

  // The componentProp writes into a signal, so the draft seeds reactively — no
  // ngOnInit to call (and none to forget).
  it('seeds the draft from an existing txn, splitting sign into direction', () => {
    setup(
      mockCashState({
        transactions: [
          mockCashTransaction({
            id: 't1',
            description: 'Rent',
            amountCents: -50_000,
            status: 'pending',
          }),
        ],
      })
    );

    component.transactionId = 't1';

    expect(component.isEdit()).toBe(true);
    expect(component.draft()).toMatchObject({
      description: 'Rent',
      amount: '500,00',
      direction: 'expense',
      pending: true,
    });

    component.patch({ amount: '450,00' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.updateTransaction.type,
        transaction: expect.objectContaining({
          id: 't1',
          amountCents: -45_000,
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
