import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';

import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { mockCashAccount, mockCashState } from '../../testing/cash.test-data';
import { CashActions } from '../../data';
import { CashAccountEditModalComponent } from './account-edit-modal.component';

describe('CashAccountEditModalComponent', () => {
  let component: CashAccountEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockCashState()) => {
    TestBed.configureTestingModule({
      imports: [CashAccountEditModalComponent],
      providers: [provideTestingProviders({ cash: state })],
    });
    dismiss = vi
      .spyOn(TestBed.inject(ModalController), 'dismiss')
      .mockResolvedValue(true);
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      CashAccountEditModalComponent
    ).componentInstance;
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

  // A negative balance is a credit card, not an error — the only thing that can
  // be wrong with the box is text that is not an amount, and `app-money-input`
  // reports that itself (covered in `e2e/cash/amount-input.e2e.ts`).
  it('accepts a negative opening balance', () => {
    setup();

    component.patch({ name: 'Visa', openingBalanceCents: -25_000 });

    expect(component.balanceInvalid()).toBe(false);
    expect(component.canSave()).toBe(true);
  });

  // Same trap as the transaction dialog: a cleared date used to reach
  // `openingDateISO` as the string 'Invalid Date'.
  it('blocks saving on a cleared opening date', () => {
    setup();

    component.patch({ name: 'Giro', openingDate: '' });

    expect(component.openingDateInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  // The componentProp writes into a signal, so the draft seeds reactively — no
  // ngOnInit to call (and none to forget).
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
