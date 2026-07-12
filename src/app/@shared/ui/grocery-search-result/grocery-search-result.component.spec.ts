import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ISearchResult, IStorageItem } from '../../../@shared/types';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import {
  mockGlobalItem,
  mockShoppingItem,
  mockStorageItem,
} from '../../../@shared/testing/test-data';
import { GrocerySearchResultComponent } from './grocery-search-result.component';

function mockResults(
  overrides: Partial<ISearchResult<IStorageItem>> = {}
): ISearchResult<IStorageItem> {
  return {
    listItems: [],
    hasSearchTerm: true,
    searchTerm: 'su',
    globalItems: [],
    storageItems: [],
    shoppingItems: [],
    ...overrides,
  };
}

describe('GrocerySearchResultComponent', () => {
  let fixture: ComponentFixture<GrocerySearchResultComponent<IStorageItem>>;
  let component: GrocerySearchResultComponent<IStorageItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrocerySearchResultComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent<
      GrocerySearchResultComponent<IStorageItem>
    >(GrocerySearchResultComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders no sub-lists when there are no results', () => {
    component.results = mockResults();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-item-list')
    ).toHaveLength(0);
  });

  it('renders a global result sub-list with the item name', () => {
    component.results = mockResults({
      globalItems: [mockGlobalItem({ name: 'Sugar' })],
    });
    fixture.detectChanges();

    const lists = fixture.nativeElement.querySelectorAll('app-item-list');
    expect(lists).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Sugar');
    expect(fixture.nativeElement.textContent).toContain(
      'list-header.global.search'
    );
  });

  it('renders one sub-list per non-empty result group', () => {
    component.results = mockResults({
      globalItems: [mockGlobalItem()],
      shoppingItems: [mockShoppingItem()],
      storageItems: [mockStorageItem()],
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-item-list')
    ).toHaveLength(3);
  });

  it('emits selectGlobalItem with the item', () => {
    const item = mockGlobalItem();
    const emitted: unknown[] = [];
    component.selectGlobalItem.subscribe((v) => emitted.push(v));

    component.selectGlobalItem.emit(item);

    expect(emitted).toEqual([item]);
  });

  it('emits selectShoppingItem with the item', () => {
    const item = mockShoppingItem();
    const emitted: unknown[] = [];
    component.selectShoppingItem.subscribe((v) => emitted.push(v));

    component.selectShoppingItem.emit(item);

    expect(emitted).toEqual([item]);
  });

  it('emits selectStorageItem with the item', () => {
    const item = mockStorageItem();
    const emitted: unknown[] = [];
    component.selectStorageItem.subscribe((v) => emitted.push(v));

    component.selectStorageItem.emit(item);

    expect(emitted).toEqual([item]);
  });
});
