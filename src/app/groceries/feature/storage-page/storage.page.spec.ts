import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockStorageItem } from '../../testing/grocery.test-data';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
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
    // NOTE: no `detectChanges()` — the template embeds `ListPageComponent`,
    // whose router-based selectors throw against the seeded (router-less) mock
    // state. We test the component's methods directly against a dispatch spy.
    component = TestBed.createComponent(StoragePage).componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches enterPage on ionViewWillEnter', () => {
    component.ionViewWillEnter();
    expect(dispatch).toHaveBeenCalledWith(StorageActions.enterPage());
  });

  it('dispatches removeItem with the item', () => {
    const item = mockStorageItem();
    component.removeItem(item);
    expect(dispatch).toHaveBeenCalledWith(StorageActions.removeItem(item));
  });

  it('dispatches showEditDialog scoped to the storage list', () => {
    const item = mockStorageItem();
    component.showEditDialog(item);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.showEditDialog(item, '_storage')
    );
  });

  it('dispatches a toggling updateSort for the given sort type', () => {
    component.setSortMode('name');
    expect(dispatch).toHaveBeenCalledWith(
      StorageActions.updateSort('name', 'toggle')
    );
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
