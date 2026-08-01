import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { IGroceriesState } from '../../model/groceries.types';
import {
  mockGroceriesState,
  mockListSettings,
  mockProduct,
  mockProductsState,
  mockShoppingState,
} from '../../testing/groceries.test-data';
import { ItemListQuickAddComponent } from './item-list-quick-add.component';

// The row's state is DERIVED from the one `groceries` slice now, so a spec states
// the real precondition — a search query with no matching row — instead of seeding
// a fabricated `quickAdd` value the app could never have produced. With no
// `:listId` in the mock router the active list falls back to `_shopping`.
async function setup(grocery: Partial<IGroceriesState> = {}) {
  await TestBed.configureTestingModule({
    imports: [ItemListQuickAddComponent],
    providers: provideTestingProviders({
      groceries: mockGroceriesState(grocery),
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

  it('emits quickAddItem', async () => {
    const { component } = await setup();
    const emitted: void[] = [];
    component.quickAddItem.subscribe((v) => emitted.push(v));

    component.quickAddItem.emit();

    expect(emitted).toHaveLength(1);
  });

  it('emits quickCreateProduct', async () => {
    const { component } = await setup();
    const emitted: void[] = [];
    component.quickCreateProduct.subscribe((v) => emitted.push(v));

    component.quickCreateProduct.emit();

    expect(emitted).toHaveLength(1);
  });
});
