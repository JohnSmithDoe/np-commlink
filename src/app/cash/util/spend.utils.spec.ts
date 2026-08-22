import { mockCashAccount } from '../testing/cash.test-data';
import { accountsForMethod, createCashSpend } from './spend.utils';

const tin = mockCashAccount({ id: 'tin', kind: 'cash' });
const giro = mockCashAccount({ id: 'giro', kind: 'giro' });
const credit = mockCashAccount({ id: 'credit', kind: 'creditcard' });
const savings = mockCashAccount({ id: 'savings', kind: 'savings' });
const all = [tin, giro, credit, savings];

describe('accountsForMethod', () => {
  it('offers the cash tin to cash, and both plastic kinds to card', () => {
    expect(accountsForMethod(all, 'cash')).toEqual([tin]);
    expect(accountsForMethod(all, 'card')).toEqual([giro, credit]);
  });

  it('offers savings to neither', () => {
    expect(accountsForMethod([savings], 'cash')).toEqual([]);
    expect(accountsForMethod([savings], 'card')).toEqual([]);
  });
});

describe('createCashSpend', () => {
  it('books cash as confirmed, because nothing else will report it', () => {
    const spend = createCashSpend('Kaffee', 'tin', 250, 'cash');
    expect(spend.status).toBe('confirmed');
    expect(spend.amountCents).toBe(-250);
    expect(spend.source).toBe('manual');
  });

  it('books card as pending, so the statement reconciles instead of doubling', () => {
    expect(createCashSpend('Kaffee', 'giro', 250, 'card').status).toBe(
      'pending'
    );
  });

  it('signs the amount out whatever the caller passed', () => {
    expect(createCashSpend('Kaffee', 'tin', -250, 'cash').amountCents).toBe(
      -250
    );
  });

  it('stamps categoryManual only when a category was picked', () => {
    const filed = createCashSpend('x', 'tin', 250, 'cash', 'cat-food');
    expect(filed.categoryIds).toEqual(['cat-food']);
    expect(filed.categoryManual).toBe(true);
    expect(createCashSpend('x', 'tin', 250, 'cash').categoryManual).toBe(
      undefined
    );
  });
});
