import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { mockCategory } from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { CASH_CATEGORIES_LIST_ID } from '../../model/cash.types';
import {
  mockCashCategoryList,
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { CashCategoriesActions } from './cash-categories.actions';
import { CashCategoriesPageFacade } from './cash-categories-page.facade';

describe('CashCategoriesPageFacade', () => {
  let facade: CashCategoriesPageFacade;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockCashState()) => {
    TestBed.configureTestingModule({
      providers: [provideTestingProviders({ cash: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    facade = TestBed.inject(CashCategoriesPageFacade);
  };

  it('serves the catalog as an ordinary sorted list', () => {
    setup(
      mockCashState({
        categories: mockCashCategoryList({
          items: [
            mockCategory({ id: 'c2', name: 'Wohnen' }),
            mockCategory({ id: 'c1', name: 'Lebensmittel' }),
          ],
          sort: { sortBy: 'name', sortDirection: 'asc' },
        }),
      })
    );

    expect(facade.items()?.map((entry) => entry.name)).toEqual([
      'Lebensmittel',
      'Wohnen',
    ]);
  });

  it('counts only live transactions per category', () => {
    setup(
      mockCashState({
        categories: mockCashCategoryList({
          items: [mockCategory({ id: 'c1', name: 'Lebensmittel' })],
        }),
        transactions: [
          mockCashTransaction({ id: 't1', categoryIds: ['c1'] }),
          mockCashTransaction({ id: 't2', categoryIds: ['c1'] }),
          mockCashTransaction({
            id: 't3',
            categoryIds: ['c1'],
            matchedTxnId: 't1',
          }),
        ],
      })
    );

    expect(facade.countById().get('c1')).toBe(2);
  });

  it('opens the shared dialog over an existing entry for a rename', () => {
    const food = mockCategory({ id: 'c1', name: 'Lebensmittel' });
    setup(
      mockCashState({ categories: mockCashCategoryList({ items: [food] }) })
    );

    facade.showEditDialog(food);

    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.listId).toBe(CASH_CATEGORIES_LIST_ID);
    expect(request?.editMode).toBe('update');
    expect(request?.item.name).toBe('Lebensmittel');
  });

  it('hands a save to the shared add-or-update routing action', () => {
    const food = mockCategory({ id: 'c1', name: 'Lebensmittel' });
    setup(
      mockCashState({ categories: mockCashCategoryList({ items: [food] }) })
    );
    const renamed = { ...food, name: 'Essen' };

    facade.saveCategory(renamed);

    expect(dispatch).toHaveBeenCalledWith(
      CashCategoriesActions.addOrUpdateItem(renamed)
    );
  });

  it('removes by id', () => {
    setup();

    const wohnen = mockCategory({ id: 'c2', name: 'Wohnen' });
    facade.removeCategory(wohnen);

    expect(dispatch).toHaveBeenCalledWith(
      CashCategoriesActions.removeItem(wohnen)
    );
  });

  it('drills into the category → transactions view', () => {
    setup();

    facade.drillTo('c1');

    expect(navigate).toHaveBeenCalledWith(['/cash/category', 'c1']);
  });
});
