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

  // The magnitude + direction form maps onto one signed amountCents.
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

  // `app-money-input` reports an unparseable box itself, so the dialog only has
  // to rule out zero and negative magnitudes — hence `min(path.amountCents, 1)`.
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
    // `dayjs('').format()` returns the literal string 'Invalid Date', which
    // used to reach `dateISO`: it sorts above every real date, buckets into a
    // phantom month in the report, and can never be reconciled.
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

  // The field tree projects the draft signal instead of copying it, so a reseed
  // has to reach validity too — reading canSave() first materialises the tree
  // over the blank create-mode draft, which is what would freeze a copy.
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
