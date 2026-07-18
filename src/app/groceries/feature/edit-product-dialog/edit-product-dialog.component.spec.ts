import { TestBed } from '@angular/core/testing';
import { SelectCustomEvent } from '@ionic/angular/standalone';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import { createProduct } from '../../util/grocery.factory';
import { ProductsActions, selectEditProduct, StorageActions } from '../../data';
import { EditProductDialogComponent } from './edit-product-dialog.component';

describe('EditProductDialogComponent', () => {
  let component: EditProductDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const seed = createProduct('Butter', []);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProductDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectEditProduct, seed);
    store.refreshState();
    dispatch = vi.spyOn(store, 'dispatch');
    component = TestBed.createComponent(
      EditProductDialogComponent
    ).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('patches the draft with timespan + a default timevalue for a finite timespan', () => {
    component.setBestBeforeTimespan({
      detail: { value: 'days' },
    } as SelectCustomEvent);

    expect(component.draft()?.bestBeforeTimespan).toBe('days');
    expect(component.draft()?.bestBeforeTimevalue).toBe(1);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('clears the timevalue when the timespan is forever', () => {
    component.setBestBeforeTimespan({
      detail: { value: 'forever' },
    } as SelectCustomEvent);

    expect(component.draft()?.bestBeforeTimespan).toBe('forever');
    expect(component.draft()?.bestBeforeTimevalue).toBeUndefined();
  });

  it('saves the draft and hides the dialog on confirm', () => {
    component.setBestBeforeTimevalue(7);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      ProductsActions.addOrUpdateItem({ ...seed, bestBeforeTimevalue: 7 })
    );
    expect(dispatch).toHaveBeenCalledWith(ItemDialogsActions.hideDialog());
  });

  it('also pushes the product onto the sibling list when addToAdditionalList is set', () => {
    store.overrideSelector(selectEditState, {
      isEditing: true,
      listId: '_products',
      addToAdditionalList: '_storage',
      item: seed,
      category: { isEditing: false },
    });
    store.refreshState();

    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      ProductsActions.addOrUpdateItem(seed)
    );
    expect(dispatch).toHaveBeenCalledWith(StorageActions.addProduct(seed));
  });
});
