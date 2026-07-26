import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
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
      imports: [CashAccountEditModalComponent, TranslateModule.forRoot()],
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

  it('parses the de-DE opening balance into signed cents on create', () => {
    setup();

    component.patch({ name: 'Giro', openingBalance: '1.234,56' });
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

  it('blocks saving on an unparseable balance', () => {
    setup();

    component.patch({ name: 'Giro', openingBalance: 'abc' });

    expect(component.balanceInvalid()).toBe(true);
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
    expect(component.draft().openingBalance).toBe('50,00');

    component.patch({ name: 'Giro 2', openingBalance: '10,00' });
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
