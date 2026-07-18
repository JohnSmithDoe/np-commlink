import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { TItemListCategory } from '../../../@shared/types';
import { IProduct, TBestBeforeTimespan } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import {
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
    FormsModule,
    IonItem,
    TranslateModule,
    IonSelect,
    IonSelectOption,
    IonText,
    ReactiveFormsModule,
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

  constructor() {
    addIcons({ closeCircle });
  }

  #patch(partial: Partial<IProduct>) {
    this.draft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  updateName(name: string) {
    this.#patch({ name });
  }

  setBestBeforeTimespan(ev: SelectCustomEvent<TBestBeforeTimespan>) {
    this.#patch({
      bestBeforeTimespan: ev.detail.value,
      bestBeforeTimevalue: ev.detail.value === 'forever' ? undefined : 1,
    });
  }

  setBestBeforeTimevalue(value: number) {
    this.#patch({ bestBeforeTimevalue: value });
  }

  removeCategory(category: TItemListCategory) {
    this.#patch({
      category: (this.draft()?.category ?? []).filter((c) => c !== category),
    });
  }

  openCategoriesDialog() {
    this.categoriesDialogOpen.set(true);
  }

  confirmCategories(selection: TItemListCategory[]) {
    this.#patch({ category: selection });
    this.categoriesDialogOpen.set(false);
  }

  cancelCategories() {
    this.categoriesDialogOpen.set(false);
  }

  addCategory(category: TItemListCategory) {
    this.#store.dispatch(ProductsActions.addCategory(category));
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
