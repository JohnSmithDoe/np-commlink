import { TestBed } from '@angular/core/testing';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { mockCashAccount, mockCashState } from '../../testing/cash.test-data';
import { CashPage } from './cash.page';

const twoAccounts = () =>
  mockCashState({
    accounts: [
      mockCashAccount({ id: 'giro-1', name: 'Giro' }),
      mockCashAccount({ id: 'save-1', name: 'Sparbuch' }),
    ],
  });

const setup = (searchQuery?: string) => {
  const cash = twoAccounts();
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({
        cash: { ...cash, accounts: { ...cash.accounts, searchQuery } },
      }),
    ],
  });
  return TestBed.createComponent(CashPage).componentInstance;
};

describe('CashPage', () => {
  it('offers a transfer whenever two accounts exist', () => {
    expect(setup().canTransfer()).toBe(true);
  });

  it('still offers it while a search narrows the visible list to one', () => {
    const component = setup('Giro');

    expect(component.facade.items()).toHaveLength(1);
    expect(component.canTransfer()).toBe(true);
  });
});
