import { setupModalSpec } from '../../../../@shared/testing/modal-spec';
import {
  mockCashAccount,
  mockCashState,
} from '../../../testing/cash.test-data';
import { CashActions } from '../../../data';
import { CashAccountEditModalComponent } from './account-edit-modal.component';

describe('CashAccountEditModalComponent', () => {
  let component: CashAccountEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockCashState()) => {
    ({ component, dispatch, dismiss } = setupModalSpec(
      CashAccountEditModalComponent,
      { cash: state }
    ));
  };

  it('carries the opening balance out as signed cents on create', () => {
    setup();

    component.patch({ name: 'Giro', openingBalanceCents: 123_456 });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.addAccount.type,
        account: expect.objectContaining({
          name: 'Giro',
          openingBalanceCents: 123_456,
        }),
      })
    );
    expect(dismiss).toHaveBeenCalled();
  });

  it('treats an empty balance as zero', () => {
    setup();

    component.patch({ name: 'Bar' });

    expect(component.balanceInvalid()).toBe(false);
    expect(component.canSave()).toBe(true);
  });

  it('accepts a negative opening balance', () => {
    setup();

    component.patch({ name: 'Visa', openingBalanceCents: -25_000 });

    expect(component.balanceInvalid()).toBe(false);
    expect(component.canSave()).toBe(true);
  });

  it('blocks saving on a cleared opening date', () => {
    setup();

    component.patch({ name: 'Giro', openingDate: '' });

    expect(component.openingDateInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('seeds the draft from the account and updates it, mapping cents back out', () => {
    setup(
      mockCashState({
        accounts: [
          mockCashAccount({
            id: 'a1',
            name: 'Giro',
            openingBalanceCents: 5000,
          }),
        ],
      })
    );

    component.accountId = 'a1';

    expect(component.isEdit()).toBe(true);
    expect(component.draft().name).toBe('Giro');
    expect(component.draft().openingBalanceCents).toBe(5000);

    component.patch({ name: 'Giro 2', openingBalanceCents: 1000 });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.updateAccount.type,
        account: expect.objectContaining({
          id: 'a1',
          name: 'Giro 2',
          openingBalanceCents: 1000,
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
