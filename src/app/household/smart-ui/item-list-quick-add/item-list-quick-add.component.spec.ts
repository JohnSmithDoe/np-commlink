import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TextItemComponent } from '../../../@shared/ui/base-item/text-item/text-item.component';
import { HouseholdListPageFacade } from '../../data';
import { HouseholdState } from '../../model/household.types';
import {
  mockHouseholdState,
  mockListSettings,
  mockProduct,
  mockProductsState,
  mockShoppingState,
} from '../../testing/household.test-data';
import { ItemListQuickAddComponent } from './item-list-quick-add.component';

async function setup(household: Partial<HouseholdState> = {}) {
  await TestBed.configureTestingModule({
    imports: [ItemListQuickAddComponent],
    providers: provideTestingProviders({
      household: mockHouseholdState(household),
    }),
  }).compileComponents();
  const fixture: ComponentFixture<ItemListQuickAddComponent> =
    TestBed.createComponent(ItemListQuickAddComponent);
  return { fixture, component: fixture.componentInstance };
}

const searchingFor = (query: string) =>
  mockShoppingState({ searchQuery: query });

describe('ItemListQuickAddComponent', () => {
  it('should create', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('exposes canAddLocal=true when the query is new and the setting is on', async () => {
    const { component } = await setup({
      shopping: searchingFor('Milk'),
      listSettings: mockListSettings({ showQuickAdd: true }),
    });

    expect(component.canAddLocal()).toBe(true);
    expect(component.canAddProduct()).toBe(false);
  });

  it('exposes canAddProduct=true when the catalog lacks the name and the setting is on', async () => {
    const { component } = await setup({
      shopping: searchingFor('Milk'),
      listSettings: mockListSettings({ showQuickAddProduct: true }),
    });

    expect(component.canAddProduct()).toBe(true);
    expect(component.canAddLocal()).toBe(false);
  });

  it('withholds canAddProduct once the catalog already holds the name', async () => {
    const { component } = await setup({
      shopping: searchingFor('Milk'),
      products: mockProductsState({ items: [mockProduct({ name: 'Milk' })] }),
      listSettings: mockListSettings({ showQuickAddProduct: true }),
    });

    expect(component.canAddProduct()).toBe(false);
  });

  it('keeps canAddLocal=false when the setting is disabled', async () => {
    const { component } = await setup({
      shopping: searchingFor('Milk'),
      listSettings: mockListSettings({ showQuickAdd: false }),
    });

    expect(component.canAddLocal()).toBe(false);
  });

  it('renders a quick-add text item when local quick-add is enabled', async () => {
    const { fixture } = await setup({
      shopping: searchingFor('Milk'),
      listSettings: mockListSettings({ showQuickAdd: true }),
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-text-item')
    ).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Milk');
  });

  it('renders nothing without a search query', async () => {
    const { fixture } = await setup({
      listSettings: mockListSettings({
        showQuickAdd: true,
        showQuickAddProduct: true,
      }),
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-text-item')
    ).toHaveLength(0);
  });

  it('dispatches through the list facade instead of emitting', async () => {
    const { component } = await setup();
    const facade = TestBed.inject(HouseholdListPageFacade);
    const addItemFromSearch = vi.spyOn(facade, 'addItemFromSearch');
    const showCreateProductDialog = vi.spyOn(facade, 'showCreateProductDialog');

    component.addItem();
    component.createProduct();

    expect(addItemFromSearch).toHaveBeenCalledOnce();
    expect(showCreateProductDialog).toHaveBeenCalledOnce();
  });

  it('reaches the facade from the rendered row, not just from the class', async () => {
    const { fixture } = await setup({
      shopping: searchingFor('Milk'),
      listSettings: mockListSettings({ showQuickAdd: true }),
    });
    fixture.detectChanges();
    const addItemFromSearch = vi.spyOn(
      TestBed.inject(HouseholdListPageFacade),
      'addItemFromSearch'
    );

    fixture.debugElement
      .query(By.directive(TextItemComponent))
      .componentInstance.selectItem.emit();

    expect(addItemFromSearch).toHaveBeenCalledOnce();
  });
});
