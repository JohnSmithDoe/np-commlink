import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { mockCashAccount, mockCashState } from '../../testing/cash.test-data';
import { CashActions } from '../../data';
import { CashTransferModalComponent } from './transfer-modal.component';

describe('CashTransferModalComponent', () => {
  let component: CashTransferModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = () => {
    TestBed.configureTestingModule({
      imports: [CashTransferModalComponent, TranslateModule.forRoot()],
      providers: [
        provideTestingProviders({
          cash: mockCashState({
            accounts: [
              mockCashAccount({ id: 'giro', name: 'Giro' }),
              mockCashAccount({ id: 'savings', name: 'Sparbuch' }),
            ],
          }),
        }),
      ],
    });
    dismiss = vi
      .spyOn(TestBed.inject(ModalController), 'dismiss')
      .mockResolvedValue(true);
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      CashTransferModalComponent
    ).componentInstance;
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
      amount: '50,00',
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

    component.patch({ fromId: 'giro', toId: 'giro', amount: '50,00' });

    expect(component.sameAccount()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses a zero or unparseable amount', () => {
    setup();

    component.patch({ fromId: 'giro', toId: 'savings', amount: '0' });
    expect(component.amountInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.patch({ amount: 'abc' });
    expect(component.amountInvalid()).toBe(true);
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
      amount: '10,00',
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

    component.patch({ fromId: 'giro', toId: 'savings', amount: '50,00' });
    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
