import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockShoppingItem } from '../../../@shared/testing/test-data';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { ShoppingActions } from '../../data/shopping.actions';
import { ShoppingPage } from './shopping.page';

describe('ShoppingPage', () => {
  let component: ShoppingPage;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingPage],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    // NOTE: no `detectChanges()` — the template embeds `ListPageComponent`,
    // whose router-based selectors throw against the seeded (router-less) mock
    // state. We test the component's methods directly against a dispatch spy.
    component = TestBed.createComponent(ShoppingPage).componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches enterPage on ionViewWillEnter', () => {
    component.ionViewWillEnter();
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.enterPage());
  });

  it('dispatches removeItem with the item', () => {
    const item = mockShoppingItem();
    component.removeItem(item);
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.removeItem(item));
  });

  it('dispatches showEditDialog scoped to the shopping list', () => {
    const item = mockShoppingItem();
    component.showEditDialog(item);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.showEditDialog(item, '_shopping')
    );
  });

  it('increases quantity by a positive diff', () => {
    const item = mockShoppingItem({ quantity: 2 });
    component.changeQuantity(item, 1);
    expect(dispatch).toHaveBeenCalledWith(
      ShoppingActions.updateItem({ ...item, quantity: 3 })
    );
  });

  it('clamps quantity at 0 for a negative diff', () => {
    const item = mockShoppingItem({ quantity: 1 });
    component.changeQuantity(item, -5);
    expect(dispatch).toHaveBeenCalledWith(
      ShoppingActions.updateItem({ ...item, quantity: 0 })
    );
  });

  it('dispatches buyItem with the item', () => {
    const item = mockShoppingItem();
    component.buyItem(item);
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.buyItem(item));
  });

  it('dispatches showActionSheet when opening the action sheet', () => {
    component.openActionSheet();
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.showActionSheet());
  });
});
