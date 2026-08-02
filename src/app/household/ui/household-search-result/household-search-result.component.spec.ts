import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HouseholdSearchResult,
  StorageItem,
} from '../../model/household-list.types';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import {
  mockProduct,
  mockShoppingItem,
  mockStorageItem,
} from '../../testing/household.test-data';
import { HouseholdSearchResultComponent } from './household-search-result.component';

function mockResults(
  overrides: Partial<HouseholdSearchResult<StorageItem>> = {}
): HouseholdSearchResult<StorageItem> {
  return {
    listItems: [],
    searchTerm: 'su',
    products: [],
    storageItems: [],
    shoppingItems: [],
    ...overrides,
  };
}

describe('HouseholdSearchResultComponent', () => {
  let fixture: ComponentFixture<HouseholdSearchResultComponent>;
  let component: HouseholdSearchResultComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseholdSearchResultComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(HouseholdSearchResultComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders no sub-lists when there are no results', () => {
    fixture.componentRef.setInput('results', mockResults());
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-item-list')
    ).toHaveLength(0);
  });

  it('renders a global result sub-list with the item name', () => {
    fixture.componentRef.setInput(
      'results',
      mockResults({ products: [mockProduct({ name: 'Sugar' })] })
    );
    fixture.detectChanges();

    const lists = fixture.nativeElement.querySelectorAll('app-item-list');
    expect(lists).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Sugar');
    expect(fixture.nativeElement.textContent).toContain(
      'list-header.product.search'
    );
  });

  it('renders one sub-list per non-empty result group', () => {
    fixture.componentRef.setInput(
      'results',
      mockResults({
        products: [mockProduct()],
        shoppingItems: [mockShoppingItem()],
        storageItems: [mockStorageItem()],
      })
    );
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-item-list')
    ).toHaveLength(3);
  });
});
