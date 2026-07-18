import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { TItemListCategory } from '../../../@shared/types';
import { IShoppingItem } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import {
  selectEditShoppingItem,
  selectShoppingCategories,
  selectShoppingState,
  ShoppingActions,
} from '../../data';

/**
 * Shopping edit-dialog wrapper (type:feature). Same shape as the storage
 * wrapper: reads the shared open-command, owns the edit draft locally, saves
 * via `ShoppingActions.addOrUpdateItem` on confirm, and handles categories
 * against the shopping slice (dialog refactor stage 3).
 */
@Component({
  selector: 'app-edit-shopping-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-shopping-item-dialog.component.html',
  styleUrl: './edit-shopping-item-dialog.component.scss',
})
export class EditShoppingItemDialogComponent {
  readonly #store = inject(Store);

  readonly #open = this.#store.selectSignal(selectEditState);
  readonly seedItem = this.#store.selectSignal(selectEditShoppingItem);
  readonly categories = this.#store.selectSignal(selectShoppingCategories);
  readonly #shopping = this.#store.selectSignal(selectShoppingState);
  readonly listItems = computed(() => this.#shopping()?.items ?? null);

  readonly isOpen = computed(
    () => this.#open().isEditing === true && this.#open().listId === '_shopping'
  );
  readonly saveButtonText = computed(() => this.#open().saveButtonText ?? '');
  readonly dialogTitle = computed(() => this.#open().dialogTitle ?? '');

  readonly draft = linkedSignal<IShoppingItem | undefined>(() => {
    const item = this.seedItem();
    return item ? { ...item } : undefined;
  });

  readonly categoriesDialogOpen = signal(false);

  constructor() {
    addIcons({ closeCircle });
  }

  #patch(partial: Partial<IShoppingItem>) {
    this.draft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  updateName(name: string) {
    this.#patch({ name });
  }

  updateQuantity(value: number) {
    this.#patch({ quantity: value });
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
    this.#store.dispatch(ShoppingActions.addCategory(category));
  }

  confirm() {
    const draft = this.draft();
    if (draft) {
      this.#store.dispatch(ShoppingActions.addOrUpdateItem(draft));
    }
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }

  close() {
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }
}
