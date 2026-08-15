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

  it('renders no rows when there are no results', () => {
    fixture.componentRef.setInput('results', mockResults());
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-text-item')
    ).toHaveLength(0);
  });

  it('names the source list on a row rather than in a group header', () => {
    fixture.componentRef.setInput(
      'results',
      mockResults({ products: [mockProduct({ name: 'Sugar' })] })
    );
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('app-text-item');
    expect(rows).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Sugar');
    expect(fixture.nativeElement.textContent).toContain(
      'list-header.product.search'
    );
  });

  it('renders one flat row per match across all result groups', () => {
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
      fixture.nativeElement.querySelectorAll('app-text-item')
    ).toHaveLength(3);
  });
});
