import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { mockCategory } from '../../@shared/testing/test-data';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { ItemDialogService } from '../../@shared/util/item-lists/item-dialog.service';
import { CASH_CATEGORIES_LIST_ID } from '../model/cash.types';
import {
  mockCashCategoryList,
  mockCashState,
  mockCashTransaction,
} from '../testing/cash.test-data';
import { CashActions } from './cash.actions';
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
          mockCashTransaction({ id: 't1', categoryId: 'c1' }),
          mockCashTransaction({ id: 't2', categoryId: 'c1' }),
          mockCashTransaction({
            id: 't3',
            categoryId: 'c1',
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

  it('routes a save to add for a new entry and to rename for a known one', () => {
    const food = mockCategory({ id: 'c1', name: 'Lebensmittel' });
    setup(
      mockCashState({ categories: mockCashCategoryList({ items: [food] }) })
    );

    facade.saveCategory({ ...food, name: 'Essen' });
    expect(dispatch).toHaveBeenCalledWith(
      CashActions.updateCategory('c1', 'Essen')
    );

    const fresh = mockCategory({ id: 'c9', name: 'Wohnen' });
    facade.saveCategory(fresh);
    expect(dispatch).toHaveBeenCalledWith(CashActions.addCategory(fresh));
  });

  it('removes by id', () => {
    setup();

    facade.removeCategory(mockCategory({ id: 'c2', name: 'Wohnen' }));

    expect(dispatch).toHaveBeenCalledWith(CashActions.removeCategory('c2'));
  });

  it('drills into the category → transactions view', () => {
    setup();

    facade.drillTo('c1');

    expect(navigate).toHaveBeenCalledWith(['/cash/category', 'c1']);
  });
});
