import { setupModalSpec } from '../../../../@shared/testing/modal-spec';
import {
  mockCashState,
  mockCashTransaction,
} from '../../../testing/cash.test-data';
import { CashActions } from '../../../data';
import { CashTransactionEditModalComponent } from './transaction-edit-modal.component';

describe('CashTransactionEditModalComponent', () => {
  let component: CashTransactionEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockCashState()) => {
    ({ component, dispatch, dismiss } = setupModalSpec(
      CashTransactionEditModalComponent,
      { cash: state }
    ));
  };

  it('signs the amount negative for an expense', () => {
    setup();
    component.accountId = 'a1';

    component.patch({ description: 'Coffee', amountCents: 350 });
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
      amountCents: 100_000,
      direction: 'income',
    });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({ amountCents: 100_000 }),
      })
    );
  });

  it('refuses to save a blank description', () => {
    setup();

    component.patch({ description: ' \t ', amountCents: 1000 });

    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('rejects a non-positive amount, and leaves an empty one unflagged', () => {
    setup();

    component.patch({ description: 'X', amountCents: 0 });
    expect(component.amountInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.patch({ amountCents: null });
    expect(component.canSave()).toBe(false);
    expect(component.amountInvalid()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses to save a cleared date rather than persisting "Invalid Date"', () => {
    setup();

    component.patch({ description: 'X', amountCents: 1000, date: '' });

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
      amountCents: 350,
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
      amountCents: 350,
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
      amountCents: 50_000,
      direction: 'expense',
      pending: true,
    });

    component.patch({ amountCents: 45_000 });
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

  it('re-derives validity after the draft reseeds', () => {
    setup(mockCashState({ transactions: [mockCashTransaction({ id: 't1' })] }));

    expect(component.canSave()).toBe(false);

    component.transactionId = 't1';

    expect(component.canSave()).toBe(true);
  });

  it('dismisses without dispatching on cancel', () => {
    setup();

    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
