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
import { IStorageItem } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import {
  selectEditStorageItem,
  selectStorageCategories,
  selectStorageListItems,
  StorageActions,
} from '../../data';

/**
 * Storage edit-dialog wrapper (type:feature). Reads the shared `itemDialogs`
 * open-command (isEditing/item/listId/labels) to know *when* to open and with
 * *which* item, then owns the edit **draft locally** — no per-keystroke store
 * dispatch — and saves directly via `StorageActions.addOrUpdateItem` on
 * confirm. Categories are local: the catalog comes from the storage slice, the
 * selection folds into the draft, a brand-new category persists to the slice.
 * Composes the pure-`ui` modal + category components (dialog refactor stage 2).
 */
@Component({
  selector: 'app-edit-storage-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    DateInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-storage-item-dialog.component.html',
  styleUrl: './edit-storage-item-dialog.component.scss',
})
export class EditStorageItemDialogComponent {
  readonly #store = inject(Store);

  readonly #open = this.#store.selectSignal(selectEditState);
  readonly seedItem = this.#store.selectSignal(selectEditStorageItem);
  readonly categories = this.#store.selectSignal(selectStorageCategories);
  readonly listItems = this.#store.selectSignal(selectStorageListItems);

  readonly isOpen = computed(
    () => this.#open().isEditing === true && this.#open().listId === '_storage'
  );
  readonly saveButtonText = computed(() => this.#open().saveButtonText ?? '');
  readonly dialogTitle = computed(() => this.#open().dialogTitle ?? '');

  // Local draft, reseeded whenever a new edit opens (showEditDialog produces a
  // fresh item ref, so the linkedSignal recomputes).
  readonly draft = linkedSignal<IStorageItem | undefined>(() => {
    const item = this.seedItem();
    return item ? { ...item } : undefined;
  });

  readonly categoriesDialogOpen = signal(false);

  constructor() {
    addIcons({ closeCircle });
  }

  #patch(partial: Partial<IStorageItem>) {
    this.draft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  updateName(name: string) {
    this.#patch({ name });
  }

  updateBestBefore(value: string | undefined) {
    this.#patch({ bestBefore: value });
  }

  updateMinAmount(value: number) {
    this.#patch({ minAmount: value });
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
    this.#store.dispatch(StorageActions.addCategory(category));
  }

  confirm() {
    const draft = this.draft();
    if (draft) {
      this.#store.dispatch(StorageActions.addOrUpdateItem(draft));
    }
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }

  close() {
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }
}
