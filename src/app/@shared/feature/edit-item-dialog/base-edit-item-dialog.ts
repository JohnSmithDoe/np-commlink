import { computed, inject, linkedSignal, Signal, signal } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { IBaseItem, ICategory, TCategoryId, TItemListId } from '../../types';
import { categoriesByIds } from '../../util/category.utils';
import { ItemDialogsActions } from '../../data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../data/item-dialogs/item-dialogs.selector';

/**
 * Abstract base for the per-domain edit-dialog wrappers (type:feature, lives in
 * @shared/feature so the sealed domains may extend it via
 * `featureMayUseSharedFeature`). Owns the plumbing every wrapper repeated: read
 * the domain-blind `itemDialogs` open-command, keep the edit draft LOCAL (no
 * per-keystroke dispatch), and save via the domain's own action on confirm.
 *
 * The three per-domain differences are abstract members the subclass supplies:
 * the `listId` it guards on, the typed `seedItem`/`listItems` selectors, and the
 * `save` action factory. Domain-specific field updaters (quantity, prio, …) stay
 * in the subclass — different fields, nothing to share. Angular does not inherit
 * `@Component` metadata, so each wrapper still declares its own imports/template.
 */
export abstract class BaseEditItemDialog<T extends IBaseItem> {
  protected readonly store = inject(Store);

  readonly #open = this.store.selectSignal(selectEditState);

  protected abstract readonly listId: TItemListId;
  abstract readonly seedItem: Signal<T | undefined>;
  abstract readonly listItems: Signal<T[] | null | undefined>;
  protected abstract save(item: T): Action;

  readonly isOpen = computed(
    () => this.#open().isEditing === true && this.#open().listId === this.listId
  );
  readonly saveButtonText = computed(() => this.#open().saveButtonText ?? '');
  readonly dialogTitle = computed(() => this.#open().dialogTitle ?? '');

  // Local draft, reseeded whenever a new edit opens (the open-command produces a
  // fresh item ref, so the linkedSignal recomputes).
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
      this.store.dispatch(this.save(draft));
    }
    this.store.dispatch(ItemDialogsActions.hideDialog());
  }

  close() {
    this.store.dispatch(ItemDialogsActions.hideDialog());
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

  protected abstract addCategoryAction(category: ICategory): Action;
  protected abstract removeCategoryAction(categoryId: TCategoryId): Action;
  protected abstract renameCategoryAction(id: TCategoryId, to: string): Action;

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
    this.store.dispatch(this.addCategoryAction(category));
  }

  // Catalog delete (picker swipe): remove it from the domain catalog (cascades
  // to every item) and from the local draft so this item stays consistent
  // pre-save.
  deleteCategory(categoryId: TCategoryId) {
    this.store.dispatch(this.removeCategoryAction(categoryId));
    this.#dropFromDraft(categoryId);
  }

  // Rename is O(1) on the catalog; items reference by id, so the draft is
  // unchanged.
  renameCategory({ id, to }: { id: TCategoryId; to: string }) {
    this.store.dispatch(this.renameCategoryAction(id, to));
  }

  #dropFromDraft(categoryId: TCategoryId) {
    this.patch({
      categoryIds: (this.draft()?.categoryIds ?? []).filter(
        (id) => id !== categoryId
      ),
    } as Partial<T>);
  }
}
