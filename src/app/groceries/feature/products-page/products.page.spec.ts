import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockProduct } from '../../testing/groceries.test-data';
import { ItemDialogService } from '../../../@shared/util/item-dialog.service';
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
    // NOTE: no `detectChanges()` — the template embeds `ListPageComponent`,
    // whose router-based selectors throw against the seeded (router-less) mock
    // state. We test the component's methods directly against a dispatch spy.
    component = TestBed.createComponent(ProductsPage).componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches enterPage on ionViewWillEnter', () => {
    component.ionViewWillEnter();
    expect(dispatch).toHaveBeenCalledWith(ProductsActions.enterPage());
  });

  it('dispatches removeItem with the item', () => {
    const item = mockProduct();
    component.removeItem(item);
    expect(dispatch).toHaveBeenCalledWith(ProductsActions.removeItem(item));
  });

  it('opens the edit dialog scoped to the globals list', () => {
    const item = mockProduct();
    component.showEditDialog(item);
    expect(TestBed.inject(ItemDialogService).request()).toEqual({
      item,
      listId: '_products',
      editMode: 'update',
    });
  });
});
