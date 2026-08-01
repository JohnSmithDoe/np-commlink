import { setupModalSpec } from '../../../../@shared/testing/modal-spec';
import {
  mockCashAccount,
  mockCashState,
} from '../../../testing/cash.test-data';
import { CashActions } from '../../../data';
import { CashTransferModalComponent } from './transfer-modal.component';

describe('CashTransferModalComponent', () => {
  let component: CashTransferModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = () => {
    ({ component, dispatch, dismiss } = setupModalSpec(
      CashTransferModalComponent,
      {
        cash: mockCashState({
          accounts: [
            mockCashAccount({ id: 'giro', name: 'Giro' }),
            mockCashAccount({ id: 'savings', name: 'Sparbuch' }),
          ],
        }),
      }
    ));
  };

  const bookedTransfer = () =>
    dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof CashActions.bookTransfer
    >;

  it('books an outflow and an inflow of equal magnitude, linked as one group', () => {
    setup();

    component.patch({
      fromId: 'giro',
      toId: 'savings',
      amountCents: 5000,
      description: 'Sparen',
    });
    component.confirm();

    const action = bookedTransfer();
    expect(action.type).toBe(CashActions.bookTransfer.type);
    expect(action.fromLeg).toMatchObject({
      accountId: 'giro',
      amountCents: -5000,
      description: 'Sparen',
      isTransfer: true,
      source: 'manual',
      status: 'confirmed',
    });
    expect(action.toLeg).toMatchObject({
      accountId: 'savings',
      amountCents: 5000,
      isTransfer: true,
    });
    // The shared group id is what lets deleting one leg take the other with it;
    // distinct ids are what keep the pair two rows in two ledgers.
    expect(action.fromLeg.transferGroupId).toBe(action.toLeg.transferGroupId);
    expect(action.fromLeg.id).not.toBe(action.toLeg.id);
    expect(dismiss).toHaveBeenCalled();
  });

  it('refuses a transfer into the account it comes from', () => {
    setup();

    component.patch({ fromId: 'giro', toId: 'giro', amountCents: 5000 });

    expect(component.sameAccount()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  // `app-money-input` reports an unparseable box itself, so what is left here is
  // `min(path.amountCents, 1)`: a transfer of nothing is not a transfer.
  it('refuses a zero amount', () => {
    setup();

    component.patch({ fromId: 'giro', toId: 'savings', amountCents: 0 });
    expect(component.amountInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  // Same trap as the transaction dialog: the cleared date used to reach BOTH
  // legs as the string 'Invalid Date'.
  it('refuses a cleared date', () => {
    setup();

    component.patch({
      fromId: 'giro',
      toId: 'savings',
      amountCents: 5000,
      date: '',
    });

    expect(component.dateInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('leaves an untouched amount unsaveable without flagging it as an error', () => {
    setup();

    component.patch({ fromId: 'giro', toId: 'savings' });

    expect(component.amountInvalid()).toBe(false);
    expect(component.canSave()).toBe(false);
  });

  it('falls back to the default label rather than booking a blank description', () => {
    setup();

    component.patch({
      fromId: 'giro',
      toId: 'savings',
      amountCents: 1000,
      description: ' ',
    });
    component.confirm();

    // With no translations loaded, `instant` echoes the key back — so the key is
    // the label here.
    expect(bookedTransfer().fromLeg.description).toBe(
      'cash.transfer.default-description'
    );
  });

  it('dismisses without booking half a transfer on cancel', () => {
    setup();

    component.patch({ fromId: 'giro', toId: 'savings', amountCents: 5000 });
    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
