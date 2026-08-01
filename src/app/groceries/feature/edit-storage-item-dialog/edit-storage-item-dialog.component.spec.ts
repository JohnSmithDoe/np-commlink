import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import {
  mockGroceriesState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/groceries.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
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
  // A real sibling, so the duplicate-name rule below has something to catch — an
  // `items: []` slice would make that branch unreachable while looking seeded.
  const sibling = mockStorageItem({ id: 'other', name: 'Bread' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStorageItemDialogComponent],
      providers: [
        ...provideTestingProviders({
          groceries: mockGroceriesState({
            // The search query is load-bearing: it is what the storage PAGE's
            // view would filter `sibling` out with. Seeding it here makes the
            // duplicate-name test below a regression guard for reading the page
            // view instead of the aggregate.
            storage: mockStorageState({
              searchQuery: 'Milk',
              items: [sibling, seed],
            }),
          }),
        }),
      ],
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

    expect(component.draft().minAmount).toBe(5);
    expect(component.draft().bestBefore).toBe('2024-12-31');
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
      GroceryCategoriesActions.addItem(category)
    );
  });

  // The rule is the BASE's schema; which list it compares against is this
  // wrapper's wiring, and that is the half that silently went wrong — the page's
  // filtered view hides `Bread` under the seeded search query, so a dialog reading
  // it would happily save a second `Bread`.
  it('refuses a sibling name the page search is currently hiding', () => {
    expect(component.canSave()).toBe(true);

    component.form.name().value.set('Bread');

    expect(component.canSave()).toBe(false);
  });

  it('folds the confirmed category-id selection into the draft', () => {
    component.confirmCategories(['dairy', 'fridge']);
    expect(component.draft().categoryIds).toEqual(['dairy', 'fridge']);
    expect(component.categoriesDialogOpen()).toBe(false);
  });
});
