import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { IListPageFacade, LIST_FACADE } from '../../data/list/list-page.facade';
import { ListPageComponent } from './list-page.component';

// Domain-blind stub of the facade contract: the generic page must be testable
// without reaching into any concrete list domain (grocery/tasks). Only the
// creation smoke test runs here (no detectChanges), so no-op signals suffice.
const FAKE_LIST_FACADE: IListPageFacade = {
  state: signal(undefined),
  filter: signal({ isCategoryModeOrHasFilter: false, hasFilter: false }),
  items: signal(undefined),
  searchResult: signal(undefined),
  categories: signal([]),
  search: () => {},
  addItemFromSearch: () => {},
  addCategoryFromSearch: () => {},
  setDisplayMode: () => {},
  setSortMode: () => {},
  selectCategory: () => {},
  deleteCategory: () => {},
  showCreateDialog: () => {},
};

describe('ListPageComponent', () => {
  let fixture: ComponentFixture<ListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: LIST_FACADE, useValue: FAKE_LIST_FACADE },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ListPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
