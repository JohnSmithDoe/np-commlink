import { TestBed } from '@angular/core/testing';
import { SelectCustomEvent } from '@ionic/angular/standalone';
import { MockStore } from '@ngrx/store/testing';
import {
  mockHouseholdState,
  mockProduct,
  mockProductsState,
} from '../../testing/household.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { createProduct } from '../../util/household.factory';
import { ProductsActions, StorageActions } from '../../data';
import { EditProductDialogComponent } from './edit-product-dialog.component';

describe('EditProductDialogComponent', () => {
  let component: EditProductDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const seed = createProduct('Butter', []);
  const sibling = mockProduct({ id: 'other', name: 'Margarine' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProductDialogComponent],
      providers: [
        ...provideTestingProviders({
          household: mockHouseholdState({
            products: mockProductsState({ items: [sibling, seed] }),
          }),
        }),
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: '_products', editMode: 'update' });
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

    expect(component.draft().bestBeforeTimespan).toBe('days');
    expect(component.draft().bestBeforeTimevalue).toBe(1);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('clears the timevalue when the timespan is forever', () => {
    component.setBestBeforeTimespan({
      detail: { value: 'forever' },
    } as SelectCustomEvent);

    expect(component.draft().bestBeforeTimespan).toBe('forever');
    expect(component.draft().bestBeforeTimevalue).toBeUndefined();
  });

  it('refuses a name a sibling in the catalog already has', () => {
    expect(component.canSave()).toBe(true);

    component.form.name().value.set('Margarine');

    expect(component.canSave()).toBe(false);
  });

  it('saves the draft and hides the dialog on confirm', () => {
    component.setBestBeforeTimevalue(7);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      ProductsActions.addOrUpdateItem({ ...seed, bestBeforeTimevalue: 7 })
    );
    expect(host.request()).toBeNull();
  });

  it('also pushes the product onto the sibling list when addToAdditionalList is set', () => {
    host.open({
      item: seed,
      listId: '_products',
      editMode: 'create',
      addToAdditionalList: '_storage',
    });

    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      ProductsActions.addOrUpdateItem(seed)
    );
    expect(dispatch).toHaveBeenCalledWith(StorageActions.addProduct(seed));
  });
});
