import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import {
  IonItem,
  IonSelect,
  IonSelectOption,
  IonText,
  SelectCustomEvent,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { ICategory, TCategoryId } from '../../../@shared/types';
import { categoriesByIds } from '../../../@shared/util/category.utils';
import { IProduct, TBestBeforeTimespan } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import {
  GroceryCategoriesActions,
  ProductsActions,
  selectEditProduct,
  selectProductListItems,
  selectProductsCategories,
  ShoppingActions,
  StorageActions,
} from '../../data';

/**
 * Product edit-dialog wrapper (type:feature). Like the storage/shopping
 * wrappers, but preserves the "create & add to another list" flow: when the
 * open-command carries `addToAdditionalList` (set by
 * showCreateAndAddProductDialog from the storage/shopping pages), confirming
 * also pushes the product onto that sibling list (dialog refactor stage 3).
 */
@Component({
  selector: 'app-edit-product-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonItem,
    TranslateModule,
    IonSelect,
    IonSelectOption,
    IonText,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-product-dialog.component.html',
  styleUrl: './edit-product-dialog.component.scss',
})
export class EditProductDialogComponent {
  readonly #store = inject(Store);

  readonly #open = this.#store.selectSignal(selectEditState);
  readonly seedItem = this.#store.selectSignal(selectEditProduct);
  readonly categories = this.#store.selectSignal(selectProductsCategories);
  readonly listItems = this.#store.selectSignal(selectProductListItems);

  readonly isOpen = computed(
    () => this.#open().isEditing === true && this.#open().listId === '_products'
  );
  readonly saveButtonText = computed(() => this.#open().saveButtonText ?? '');
  readonly dialogTitle = computed(() => this.#open().dialogTitle ?? '');

  readonly draft = linkedSignal<IProduct | undefined>(() => {
    const item = this.seedItem();
    return item ? { ...item } : undefined;
  });

  readonly categoriesDialogOpen = signal(false);

  // The draft's category ids resolved to {id,name} objects for the chip row.
  readonly selectedCategories = computed<ICategory[]>(() =>
    categoriesByIds(this.draft()?.categoryIds, this.categories())
  );

  constructor() {
    addIcons({ closeCircle });
  }

  #patch(partial: Partial<IProduct>) {
    this.draft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  updateName(name: string) {
    this.#patch({ name });
  }

  setBestBeforeTimespan(event: SelectCustomEvent<TBestBeforeTimespan>) {
    this.#patch({
      bestBeforeTimespan: event.detail.value,
      bestBeforeTimevalue: event.detail.value === 'forever' ? undefined : 1,
    });
  }

  setBestBeforeTimevalue(value: number) {
    this.#patch({ bestBeforeTimevalue: value });
  }

  removeCategory(categoryId: TCategoryId) {
    this.#patch({
      categoryIds: (this.draft()?.categoryIds ?? []).filter(
        (id) => id !== categoryId
      ),
    });
  }

  openCategoriesDialog() {
    this.categoriesDialogOpen.set(true);
  }

  confirmCategories(selection: TCategoryId[]) {
    this.#patch({ categoryIds: selection });
    this.categoriesDialogOpen.set(false);
  }

  cancelCategories() {
    this.categoriesDialogOpen.set(false);
  }

  addCategory(category: ICategory) {
    this.#store.dispatch(GroceryCategoriesActions.add(category));
  }

  // Catalog delete (picker swipe): remove it from the shared grocery catalog
  // (cascades to every item) and from the local draft so this item stays
  // consistent pre-save.
  deleteCategory(categoryId: TCategoryId) {
    this.#store.dispatch(GroceryCategoriesActions.remove(categoryId));
    this.#patch({
      categoryIds: (this.draft()?.categoryIds ?? []).filter(
        (id) => id !== categoryId
      ),
    });
  }

  // Rename is O(1) on the catalog; items reference by id, so the draft is
  // unchanged.
  renameCategory({ id, to }: { id: TCategoryId; to: string }) {
    this.#store.dispatch(GroceryCategoriesActions.rename(id, to));
  }

  confirm() {
    const draft = this.draft();
    if (draft) {
      this.#store.dispatch(ProductsActions.addOrUpdateItem(draft));
      // Create-and-add-to-another-list flow: also push onto the sibling list
      // the user was on when they opened the quick-create product dialog.
      const additional = this.#open().addToAdditionalList;
      if (additional === '_storage') {
        this.#store.dispatch(StorageActions.addProduct(draft));
      } else if (additional === '_shopping') {
        this.#store.dispatch(ShoppingActions.addProduct(draft));
      }
    }
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }

  close() {
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }
}
