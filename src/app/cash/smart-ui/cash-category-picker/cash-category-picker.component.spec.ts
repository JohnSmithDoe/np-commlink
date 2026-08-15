import { TestBed } from '@angular/core/testing';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { mockCategory } from '../../../@shared/testing/test-data';
import {
  mockCashCategoryList,
  mockCashState,
} from '../../testing/cash.test-data';
import { CashCategoryPickerComponent } from './cash-category-picker.component';

const withCategories = () =>
  mockCashState({
    categories: mockCashCategoryList({
      items: [
        mockCategory({ id: 'food', name: 'Lebensmittel' }),
        mockCategory({ id: 'grocery', name: 'Einkauf' }),
      ],
    }),
  });

const setup = () => {
  TestBed.configureTestingModule({
    providers: [provideTestingProviders({ cash: withCategories() })],
  });
  return TestBed.createComponent(CashCategoryPickerComponent).componentInstance;
};

describe('CashCategoryPickerComponent', () => {
  it('offers the catalog it also edits', () => {
    expect(
      setup()
        .categories()
        .map(({ id }) => id)
    ).toEqual(['food', 'grocery']);
  });

  it('follows the survivor when a rename merges the picked category away', () => {
    const picker = setup();
    picker.value.set('grocery');

    picker.onRename({ id: 'grocery', to: 'Lebensmittel' });

    expect(picker.value()).toBe('food');
  });

  it('leaves the picked value alone when a rename merges a different category', () => {
    const picker = setup();
    picker.value.set('food');

    picker.onRename({ id: 'grocery', to: 'Lebensmittel' });

    expect(picker.value()).toBe('food');
  });

  it('clears itself when the picked category is deleted', () => {
    const picker = setup();
    picker.value.set('food');

    picker.onDelete('food');

    expect(picker.value()).toBe('');
  });
});
