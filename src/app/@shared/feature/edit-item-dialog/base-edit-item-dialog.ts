import { computed, inject, linkedSignal, Signal, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import {
  IBaseItem,
  ICategory,
  TCategoryId,
  TEditItemMode,
  TItemListId,
  TMarker,
} from '../../model/types';
import { categoriesByIds } from '../../util/categories/category.utils';
import {
  ItemDialogHost,
  TItemDialogRequest,
} from '../../data/item-dialogs/item-dialog-host';

// Both labels are pure functions of the edit mode. They used to be derived in the
// itemDialogs reducer, i.e. a store round-trip for two strings.
const DIALOG_TITLE: Readonly<Record<TEditItemMode, TMarker>> = {
  update: marker('edit.item.dialog.title.update'),
  create: marker('edit.item.dialog.title.create'),
};
const SAVE_BUTTON: Readonly<Record<TEditItemMode, TMarker>> = {
  update: marker('edit.item.dialog.button.update'),
  create: marker('edit.item.dialog.button.create'),
};

/**
 * Abstract base for the per-domain edit-dialog wrappers (type:feature, lives in
 * @shared/feature so the sealed domains may extend it via
 * `featureMayUseSharedFeature`). Owns the plumbing every wrapper repeated: read
 * the domain-blind open-command off {@link ItemDialogHost}, keep the edit draft
 * LOCAL (no per-keystroke dispatch), and save via the domain's own facade
 * command on confirm.
 *
 * The per-domain differences are abstract members the subclass supplies from its
 * DOMAIN facade: the `listId` it answers to, the typed `listItems` signal (for
 * the duplicate-name validator) and the `save` command. This keeps NgRx sealed
 * in the data layer — neither the base nor the subclass injects `Store`.
 * Domain-specific field updaters (quantity, prio, …) stay in the subclass —
 * different fields, nothing to share. Angular does not inherit `@Component`
 * metadata, so each wrapper still declares its own imports/template.
 */
export abstract class BaseEditItemDialog<T extends IBaseItem> {
  protected readonly host = inject(ItemDialogHost);

  protected abstract readonly listId: TItemListId;
  abstract readonly listItems: Signal<T[] | null | undefined>;
  protected abstract save(item: T): void;

  // One host serves every mounted wrapper, so the command's listId is what picks
  // the target; a request for a sibling list reads as "closed" here.
  readonly #request = computed<TItemDialogRequest<T> | null>(() => {
    const request = this.host.request();
    return request?.listId === this.listId
      ? (request as TItemDialogRequest<T>)
      : null;
  });
  readonly #editMode = computed<TEditItemMode>(
    () => this.#request()?.editMode ?? 'update'
  );

  readonly isOpen = computed(() => this.#request() !== null);
  readonly seedItem = computed(() => this.#request()?.item);
  readonly saveButtonText = computed(() => SAVE_BUTTON[this.#editMode()]);
  readonly dialogTitle = computed(() => DIALOG_TITLE[this.#editMode()]);

  // The sibling list a "create & add to another list" command targets. Only the
  // product wrapper acts on it, but it rides the shared command.
  protected readonly addToAdditionalList = computed(
    () => this.#request()?.addToAdditionalList
  );

  // Local draft, reseeded whenever a new edit opens (the host copies the item, so
  // every open produces a fresh ref and the linkedSignal recomputes).
  readonly draft = linkedSignal<T | undefined>(() => {
    const item = this.seedItem();
    return item ? { ...item } : undefined;
  });

  constructor() {
    addIcons({ closeCircle });
  }

  protected patch(partial: Partial<T>) {
    this.draft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  updateName(name: string) {
    this.patch({ name } as Partial<T>);
  }

  confirm() {
    const draft = this.draft();
    if (draft) {
      this.save(draft);
    }
    this.host.close();
  }

  close() {
    this.host.close();
  }
}

/**
 * Adds the category block shared by the grocery + tasks wrappers (tracking has
 * no categories and extends the plain base). The catalog selector and the three
 * category action factories differ per domain — grocery's
 * `GroceryCategoriesActions.{add,remove,rename}` vs tasks'
 * `TasksActions.{addCategory,removeCategory,updateCategory}` — so they're
 * abstract hooks the subclass implements.
 */
export abstract class BaseCategoryEditItemDialog<
  T extends IBaseItem,
> extends BaseEditItemDialog<T> {
  abstract readonly categories: Signal<readonly ICategory[]>;

  readonly categoriesDialogOpen = signal(false);

  // The draft's category ids resolved to {id,name} objects for the chip row.
  readonly selectedCategories = computed<ICategory[]>(() =>
    categoriesByIds(this.draft()?.categoryIds, this.categories())
  );

  // Domain catalog commands the subclass wires to its own facade. Kept `void`
  // (not action factories) so no NgRx leaks into the wrapper.
  protected abstract addCategoryCmd(category: ICategory): void;
  protected abstract removeCategoryCmd(categoryId: TCategoryId): void;
  protected abstract renameCategoryCmd(id: TCategoryId, to: string): void;

  removeCategory(categoryId: TCategoryId) {
    this.#dropFromDraft(categoryId);
  }

  openCategoriesDialog() {
    this.categoriesDialogOpen.set(true);
  }

  confirmCategories(selection: TCategoryId[]) {
    this.patch({ categoryIds: selection } as Partial<T>);
    this.categoriesDialogOpen.set(false);
  }

  cancelCategories() {
    this.categoriesDialogOpen.set(false);
  }

  addCategory(category: ICategory) {
    this.addCategoryCmd(category);
  }

  // Catalog delete (picker swipe): remove it from the domain catalog (cascades
  // to every item) and from the local draft so this item stays consistent
  // pre-save.
  deleteCategory(categoryId: TCategoryId) {
    this.removeCategoryCmd(categoryId);
    this.#dropFromDraft(categoryId);
  }

  // Rename is O(1) on the catalog; items reference by id, so the draft is
  // unchanged.
  renameCategory({ id, to }: { id: TCategoryId; to: string }) {
    this.renameCategoryCmd(id, to);
  }

  #dropFromDraft(categoryId: TCategoryId) {
    this.patch({
      categoryIds: (this.draft()?.categoryIds ?? []).filter(
        (id) => id !== categoryId
      ),
    } as Partial<T>);
  }
}
