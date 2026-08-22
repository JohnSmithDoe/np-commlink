import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { CashAccount } from '../../model/account.types';
import { CashTransaction } from '../../model/transaction.types';
import {
  mockCashAccount,
  mockCashCategoryList,
  mockCashState,
} from '../../testing/cash.test-data';
import { CashSpendQuickAddComponent } from './spend-quick-add.component';

describe('CashSpendQuickAddComponent', () => {
  let component: CashSpendQuickAddComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const TIN = mockCashAccount({ id: 'tin', name: 'Bargeld', kind: 'cash' });
  const GIRO = mockCashAccount({ id: 'giro', name: 'Girokonto' });

  const setup = (accounts: CashAccount[] = [TIN, GIRO]) => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({
          cash: mockCashState({
            accounts,
            categories: mockCashCategoryList({
              items: [{ id: 'cat-food', name: 'Verpflegung' }],
            }),
          }),
        }),
      ],
    });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    component = TestBed.createComponent(
      CashSpendQuickAddComponent
    ).componentInstance;
  };

  const booked = (): CashTransaction =>
    (dispatch.mock.lastCall as unknown as [{ item: CashTransaction }])[0].item;

  it('books cash into the cash account, confirmed and final', () => {
    setup();

    component.amountCents.set(1200);
    component.book();

    expect(booked()).toMatchObject({
      accountId: 'tin',
      amountCents: -1200,
      status: 'confirmed',
      source: 'manual',
    });
  });

  it('books a card spend into the card account as pending', () => {
    setup();

    component.setMethod('card');
    component.amountCents.set(1500);
    component.book();

    expect(booked()).toMatchObject({
      accountId: 'giro',
      amountCents: -1500,
      status: 'pending',
    });
  });

  it('names the booking after the category, since that is the description', () => {
    setup();

    component.amountCents.set(500);
    component.categoryId.set('cat-food');
    component.book();

    expect(booked().name).toBe('Verpflegung');
    expect(booked().categoryIds).toEqual(['cat-food']);
  });

  it('never books a nameless row, which the reducer would drop in silence', () => {
    setup();

    component.amountCents.set(500);
    component.book();

    expect(booked().name.trim()).not.toBe('');
  });

  it('clears the amount but keeps the method and category for the next spend', () => {
    setup();

    component.setMethod('card');
    component.categoryId.set('cat-food');
    component.amountCents.set(500);
    component.book();

    expect(component.amountCents()).toBeNull();
    expect(component.method()).toBe('card');
    expect(component.categoryId()).toBe('cat-food');
  });

  it('toggles a preset off when it is tapped twice', () => {
    setup();

    component.pickPreset(1000);
    expect(component.amountCents()).toBe(1000);

    component.pickPreset(1000);
    expect(component.amountCents()).toBeNull();
  });

  it('refuses to book without an amount or without an account', () => {
    setup();
    expect(component.canBook()).toBe(false);

    component.amountCents.set(1000);
    expect(component.canBook()).toBe(true);

    component.book();
    expect(dispatch).toHaveBeenCalledTimes(1);
    component.book();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('asks for an account only when the method leaves a choice', () => {
    setup([TIN, GIRO, mockCashAccount({ id: 'credit', kind: 'creditcard' })]);

    expect(component.needsAccountChoice()).toBe(false);
    component.setMethod('card');
    expect(component.needsAccountChoice()).toBe(true);
  });

  it('falls back when the chosen account does not survive a method switch', () => {
    setup();

    component.setMethod('card');
    component.chooseAccount('giro');
    component.setMethod('cash');

    expect(component.account()?.id).toBe('tin');
  });

  it('reports having nowhere to book rather than dropping the spend', () => {
    setup([mockCashAccount({ id: 'nest', kind: 'savings' })]);

    expect(component.hasNoAccount()).toBe(true);
    expect(component.canBook()).toBe(false);
  });
});
