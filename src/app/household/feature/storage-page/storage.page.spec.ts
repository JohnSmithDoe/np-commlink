import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockStorageItem } from '../../testing/household.test-data';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
import { StorageActions } from '../../data';
import { StoragePage } from './storage.page';

describe('StoragePage', () => {
  let component: StoragePage;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoragePage],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    component = TestBed.createComponent(StoragePage).componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches removeItem with the item', () => {
    const item = mockStorageItem();
    component.removeItem(item);
    expect(dispatch).toHaveBeenCalledWith(StorageActions.removeItem(item));
  });

  it('opens the edit dialog scoped to the storage list', () => {
    const item = mockStorageItem();
    component.showEditDialog(item);
    expect(TestBed.inject(ItemDialogService).request()).toEqual({
      item,
      listId: '_storage',
      editMode: 'update',
    });
  });

  it('increases quantity by a positive diff', () => {
    const item = mockStorageItem({ quantity: 2 });
    component.changeQuantity(item, 3);
    expect(dispatch).toHaveBeenCalledWith(
      StorageActions.updateItem({ ...item, quantity: 5 })
    );
  });

  it('clamps quantity at 0 for a negative diff', () => {
    const item = mockStorageItem({ quantity: 1 });
    component.changeQuantity(item, -5);
    expect(dispatch).toHaveBeenCalledWith(
      StorageActions.updateItem({ ...item, quantity: 0 })
    );
  });

  it('dispatches copyToShoppinglist with the item', () => {
    const item = mockStorageItem();
    component.copyToShoppingList(item);
    expect(dispatch).toHaveBeenCalledWith(
      StorageActions.copyToShoppinglist(item)
    );
  });
});
