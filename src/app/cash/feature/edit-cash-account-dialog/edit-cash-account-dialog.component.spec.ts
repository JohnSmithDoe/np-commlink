import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { CashAccountsActions } from '../../data';
import { CashAccount } from '../../model/account.types';
import { CASH_ACCOUNTS_LIST_ID } from '../../model/cash.types';
import { mockCashAccount, mockCashState } from '../../testing/cash.test-data';
import { createCashAccount } from '../../util/cash.factory';
import { EditCashAccountDialogComponent } from './edit-cash-account-dialog.component';

describe('EditCashAccountDialogComponent', () => {
  let component: EditCashAccountDialogComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const giro = mockCashAccount({
    id: 'a1',
    name: 'Giro',
    openingBalanceCents: 5000,
  });

  const setup = (
    seed: CashAccount = giro,
    editMode: 'create' | 'update' = 'update',
    accounts: CashAccount[] = [giro]
  ) => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({ cash: mockCashState({ accounts }) }),
      ],
    });
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: CASH_ACCOUNTS_LIST_ID, editMode });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    component = TestBed.createComponent(
      EditCashAccountDialogComponent
    ).componentInstance;
  };

  const saved = (): CashAccount =>
    (dispatch.mock.lastCall as unknown as [{ item: CashAccount }])[0].item;

  it('seeds the form from the account, mapping the ISO date onto a date input', () => {
    setup();

    expect(component.draft().name).toBe('Giro');
    expect(component.draft().openingBalanceCents).toBe(5000);
    expect(component.draft().openingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('carries the edited fields back onto the account it was seeded with', () => {
    setup();

    component.form.name().value.set('Giro 2');
    component.form.openingBalanceCents().value.set(1000);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      CashAccountsActions.addOrUpdateItem(
        expect.objectContaining({
          id: 'a1',
          name: 'Giro 2',
          openingBalanceCents: 1000,
        }) as unknown as CashAccount
      )
    );
    expect(host.request()).toBeNull();
  });

  it('treats a cleared balance as zero and an empty IBAN as absent', () => {
    setup(createCashAccount('Bar'), 'create', []);

    component.form.openingBalanceCents().value.set(null);
    component.confirm();

    expect(saved().openingBalanceCents).toBe(0);
    expect(saved().iban).toBeUndefined();
  });

  it('stores the IBAN as the statement spells it, not as it was typed', () => {
    setup(createCashAccount('Giro'), 'create', []);

    component.form.iban().value.set('de81 1009 0000 4711 0001 00');
    component.confirm();

    expect(saved().iban).toBe('DE81100900004711000100');
  });

  it('accepts a negative opening balance', () => {
    setup(createCashAccount('Visa'), 'create', []);

    component.form.openingBalanceCents().value.set(-25_000);

    expect(component.balanceInvalid()).toBe(false);
    expect(component.canSave()).toBe(true);
  });

  it('blocks saving on a cleared opening date', () => {
    setup();

    component.form.openingDate().value.set('');

    expect(component.openingDateInvalid()).toBe(true);
    expect(component.canSave()).toBe(false);

    component.confirm();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses a name another account already has', () => {
    setup(createCashAccount(''), 'create');

    component.form.name().value.set('Giro');

    expect(component.canSave()).toBe(false);
  });
});
