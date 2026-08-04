import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import {
  mockHouseholdState,
  mockShoppingItem,
  mockShoppingState,
} from '../../testing/household.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { mockCategory } from '../../../@shared/testing/test-data';
import { createShoppingItem } from '../../util/household.factory';
import { HouseholdCategoriesActions, ShoppingActions } from '../../data';
import { EditShoppingItemDialogComponent } from './edit-shopping-item-dialog.component';

describe('EditShoppingItemDialogComponent', () => {
  let component: EditShoppingItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const seed = createShoppingItem('Coffee', [], 1);
  const sibling = mockShoppingItem({ id: 'other', name: 'Tea' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditShoppingItemDialogComponent],
      providers: [
        ...provideTestingProviders({
          household: mockHouseholdState({
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
    component.setQuantity(4);
    component.form.name().value.set('Espresso');

    expect(component.draft().quantity).toBe(4);
    expect(component.draft().name).toBe('Espresso');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses a name a sibling on the shopping list already has', () => {
    expect(component.canSave()).toBe(true);

    component.form.name().value.set('Tea');

    expect(component.canSave()).toBe(false);
  });

  it('saves the draft and hides the dialog on confirm', () => {
    component.setQuantity(2);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      ShoppingActions.addOrUpdateItem({ ...seed, quantity: 2 })
    );
    expect(host.request()).toBeNull();
  });

  it('persists a brand-new category to the shared household catalog', () => {
    const category = mockCategory({ id: 'drinks', name: 'Drinks' });
    component.addCategory(category);
    expect(dispatch).toHaveBeenCalledWith(
      HouseholdCategoriesActions.addItem(category)
    );
  });
});
