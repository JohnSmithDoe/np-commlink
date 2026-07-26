import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { ItemDialogService } from '../../../@shared/util/item-dialog.service';
import { mockCategory } from '../../../@shared/testing/test-data';
import { createStorageItem } from '../../util/grocery.factory';
import { GroceryCategoriesActions, StorageActions } from '../../data';
import { EditStorageItemDialogComponent } from './edit-storage-item-dialog.component';

describe('EditStorageItemDialogComponent', () => {
  let component: EditStorageItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  // A stable seed the store hands the dialog as the item under edit.
  const seed = createStorageItem('Milk', [], 2);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStorageItemDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: '_storage', editMode: 'update' });
    dispatch = vi.spyOn(store, 'dispatch');
    component = TestBed.createComponent(
      EditStorageItemDialogComponent
    ).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('edits the local draft without dispatching per keystroke', () => {
    component.updateMinAmount(5);
    component.updateBestBefore('2024-12-31');

    expect(component.draft()?.minAmount).toBe(5);
    expect(component.draft()?.bestBefore).toBe('2024-12-31');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('saves the draft and hides the dialog on confirm', () => {
    component.updateMinAmount(9);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      StorageActions.addOrUpdateItem({ ...seed, minAmount: 9 })
    );
    expect(host.request()).toBeNull();
  });

  it('persists a brand-new category to the shared grocery catalog', () => {
    const category = mockCategory({ id: 'dairy', name: 'Dairy' });
    component.addCategory(category);
    expect(dispatch).toHaveBeenCalledWith(
      GroceryCategoriesActions.add(category)
    );
  });

  it('folds the confirmed category-id selection into the draft', () => {
    component.confirmCategories(['dairy', 'fridge']);
    expect(component.draft()?.categoryIds).toEqual(['dairy', 'fridge']);
    expect(component.categoriesDialogOpen()).toBe(false);
  });
});
