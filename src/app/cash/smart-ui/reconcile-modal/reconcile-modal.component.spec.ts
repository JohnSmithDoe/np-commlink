import { setupModalSpec } from '../../../@shared/testing/modal-spec';
import {
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { CashActions } from '../../data';
import { ICashTransaction } from '../../model/transaction.types';
import { CashReconcileModalComponent } from './reconcile-modal.component';

const pendingManualEntry = mockCashTransaction({
  id: 'm1',
  accountId: 'a1',
  amountCents: -4299,
  dateISO: '2026-01-10T00:00:00+01:00',
  source: 'manual',
  status: 'pending',
});

const importedTxn = (overrides: Partial<ICashTransaction> = {}) =>
  mockCashTransaction({
    id: 'i1',
    accountId: 'a1',
    amountCents: -4299,
    dateISO: '2026-01-11T00:00:00+01:00',
    source: 'imported',
    ...overrides,
  });

describe('CashReconcileModalComponent', () => {
  let component: CashReconcileModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (transactions: ICashTransaction[]) => {
    ({ component, dispatch, dismiss } = setupModalSpec(
      CashReconcileModalComponent,
      { cash: mockCashState({ transactions }) }
    ));
    // `transaction` is a plain componentProp, not a signal, so `candidates()`
    // captures whatever is set at its first read — Ionic writes componentProps
    // before the first render, and this assignment stands in for that.
    component.transaction = pendingManualEntry;
  };

  it('offers the imported transactions in the store that could be the same spend', () => {
    setup([
      pendingManualEntry,
      importedTxn({ id: 'same-spend' }),
      importedTxn({ id: 'other-amount', amountCents: -4300 }),
    ]);

    expect(component.candidates().map((txn) => txn.id)).toEqual(['same-spend']);
  });

  it('links the pending leg to the survivor the user picked, then dismisses', () => {
    setup([pendingManualEntry, importedTxn()]);

    component.reconcileWith(component.candidates()[0]);

    // The matchedTxnId this writes is what makes selectAccountBalances skip the
    // manual leg — without the link the one real spend is counted twice.
    expect(dispatch).toHaveBeenCalledWith(
      CashActions.reconcileTransaction('m1', 'i1')
    );
    expect(dismiss).toHaveBeenCalled();
  });

  it('only ever proposes: backing out links nothing', () => {
    setup([pendingManualEntry, importedTxn()]);

    expect(component.candidates()).toHaveLength(1);

    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
