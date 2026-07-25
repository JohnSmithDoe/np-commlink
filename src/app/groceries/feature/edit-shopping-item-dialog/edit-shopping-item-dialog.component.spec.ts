import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { ItemDialogHost } from '../../../@shared/data/item-dialogs/item-dialog-host';
import { mockCategory } from '../../../@shared/testing/test-data';
import { createShoppingItem } from '../../util/grocery.factory';
import { GroceryCategoriesActions, ShoppingActions } from '../../data';
import { EditShoppingItemDialogComponent } from './edit-shopping-item-dialog.component';

describe('EditShoppingItemDialogComponent', () => {
  let component: EditShoppingItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogHost;

  const seed = createShoppingItem('Coffee', [], 1);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditShoppingItemDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    host = TestBed.inject(ItemDialogHost);
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
    component.updateName('Espresso');

    expect(component.draft()?.quantity).toBe(4);
    expect(component.draft()?.name).toBe('Espresso');
    expect(dispatch).not.toHaveBeenCalled();
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
      GroceryCategoriesActions.add(category)
    );
  });
});
