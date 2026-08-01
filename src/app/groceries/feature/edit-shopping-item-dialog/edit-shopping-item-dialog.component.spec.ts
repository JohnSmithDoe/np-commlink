import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import {
  mockGroceriesState,
  mockShoppingItem,
  mockShoppingState,
} from '../../testing/groceries.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
import { mockCategory } from '../../../@shared/testing/test-data';
import { createShoppingItem } from '../../util/grocery.factory';
import { GroceryCategoriesActions, ShoppingActions } from '../../data';
import { EditShoppingItemDialogComponent } from './edit-shopping-item-dialog.component';

describe('EditShoppingItemDialogComponent', () => {
  let component: EditShoppingItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const seed = createShoppingItem('Coffee', [], 1);
  // A real sibling, so the duplicate-name rule below has something to catch — an
  // `items: []` slice would make that branch unreachable while looking seeded.
  const sibling = mockShoppingItem({ id: 'other', name: 'Tea' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditShoppingItemDialogComponent],
      providers: [
        ...provideTestingProviders({
          groceries: mockGroceriesState({
            shopping: mockShoppingState({ items: [sibling, seed] }),
          }),
        }),
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: '_shopping', editMode: 'update' });
    dispatch = vi.spyOn(store, 'dispatch');
    component = TestBed.createComponent(
      EditShoppingItemDialogComponent
    ).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('edits the local draft without dispatching per keystroke', () => {
    component.updateQuantity(4);
    component.form.name().value.set('Espresso');

    expect(component.draft().quantity).toBe(4);
    expect(component.draft().name).toBe('Espresso');
    expect(dispatch).not.toHaveBeenCalled();
  });

  // The rule is the BASE's schema now, but which list it compares against is this
  // wrapper's wiring — and that is the half that can silently go wrong (the
  // shopping PAGE's view would drop a sibling the search box is hiding).
  it('refuses a name a sibling on the shopping list already has', () => {
    expect(component.canSave()).toBe(true);

    component.form.name().value.set('Tea');

    expect(component.canSave()).toBe(false);
  });

  it('saves the draft and hides the dialog on confirm', () => {
    component.updateQuantity(2);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      ShoppingActions.addOrUpdateItem({ ...seed, quantity: 2 })
    );
    expect(host.request()).toBeNull();
  });

  it('persists a brand-new category to the shared grocery catalog', () => {
    const category = mockCategory({ id: 'drinks', name: 'Drinks' });
    component.addCategory(category);
    expect(dispatch).toHaveBeenCalledWith(
      GroceryCategoriesActions.addItem(category)
    );
  });
});
