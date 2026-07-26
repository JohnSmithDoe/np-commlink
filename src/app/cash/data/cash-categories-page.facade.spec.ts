import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { mockCategory } from '../../@shared/testing/test-data';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { mockCashState, mockCashTransaction } from '../testing/cash.test-data';
import { CashActions } from './actions/cash.actions';
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

  // Cash has one flat catalog (no `:listId`), so the page's list identity is
  // constant rather than route-derived.
  it('names the cash ledger as the owning list', () => {
    setup();

    expect(facade.listTitleKey()).toBe('page-title.cash');
    expect(facade.listHref()).toBe('/cash');
  });

  it('serves the catalog decorated with live transaction counts', () => {
    setup(
      mockCashState({
        categories: [
          mockCategory({ id: 'c2', name: 'Wohnen' }),
          mockCategory({ id: 'c1', name: 'Lebensmittel' }),
        ],
        transactions: [
          mockCashTransaction({ id: 't1', categoryId: 'c1' }),
          mockCashTransaction({ id: 't2', categoryId: 'c1' }),
        ],
      })
    );

    expect(facade.categories()).toEqual([
      { category: mockCategory({ id: 'c1', name: 'Lebensmittel' }), count: 2 },
      { category: mockCategory({ id: 'c2', name: 'Wohnen' }), count: 0 },
    ]);
  });

  // The page hands over a name only — the facade mints the id every txn and rule
  // will reference.
  it('mints the id for an added category', () => {
    setup();

    facade.add('Lebensmittel');

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashActions.addCategory.type,
        category: { id: expect.stringMatching(/\S/), name: 'Lebensmittel' },
      })
    );
  });

  it('renames and removes by id', () => {
    setup();

    facade.rename('c1', 'Essen');
    facade.remove('c2');

    expect(dispatch).toHaveBeenCalledWith(
      CashActions.updateCategory('c1', 'Essen')
    );
    expect(dispatch).toHaveBeenCalledWith(CashActions.removeCategory('c2'));
  });

  // Cash's answer to the grocery/tasks `?filter` drill: its own category page.
  it('drills into the category → transactions view', () => {
    setup();

    facade.drillTo('c1');

    expect(navigate).toHaveBeenCalledWith(['/cash/category', 'c1']);
  });
});
