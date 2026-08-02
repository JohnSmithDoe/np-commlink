import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import {
  mockHouseholdState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/household.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
import { mockCategory } from '../../../@shared/testing/test-data';
import { createStorageItem } from '../../util/household.factory';
import { HouseholdCategoriesActions, StorageActions } from '../../data';
import { EditStorageItemDialogComponent } from './edit-storage-item-dialog.component';

describe('EditStorageItemDialogComponent', () => {
  let component: EditStorageItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const seed = createStorageItem('Milk', [], 2);
  const sibling = mockStorageItem({ id: 'other', name: 'Bread' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStorageItemDialogComponent],
      providers: [
        ...provideTestingProviders({
          household: mockHouseholdState({
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
    component.setMinAmount(5);
    component.setBestBefore('2024-12-31');

    expect(component.draft().minAmount).toBe(5);
    expect(component.draft().bestBefore).toBe('2024-12-31');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('saves the draft and hides the dialog on confirm', () => {
    component.setMinAmount(9);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      StorageActions.addOrUpdateItem({ ...seed, minAmount: 9 })
    );
    expect(host.request()).toBeNull();
  });

  it('persists a brand-new category to the shared household catalog', () => {
    const category = mockCategory({ id: 'dairy', name: 'Dairy' });
    component.addCategory(category);
    expect(dispatch).toHaveBeenCalledWith(
      HouseholdCategoriesActions.addItem(category)
    );
  });

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
