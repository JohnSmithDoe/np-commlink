import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockProduct } from '../../testing/household.test-data';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
import { ProductsActions } from '../../data';
import { ProductsPage } from './products.page';

describe('ProductsPage', () => {
  let component: ProductsPage;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    component = TestBed.createComponent(ProductsPage).componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches removeItem with the item', () => {
    const item = mockProduct();
    component.removeItem(item);
    expect(dispatch).toHaveBeenCalledWith(ProductsActions.removeItem(item));
  });

  it('opens the edit dialog scoped to the products list', () => {
    const item = mockProduct();
    component.showEditDialog(item);
    expect(TestBed.inject(ItemDialogService).request()).toEqual({
      item,
      listId: '_products',
      editMode: 'update',
    });
  });
});
