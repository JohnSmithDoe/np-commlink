import { computed, inject, linkedSignal, Signal, signal } from '@angular/core';
import { form, SchemaPathTree } from '@angular/forms/signals';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { TMarker } from '../../model/app.types';
import { IBaseItem, TEditItemMode } from '../../model/base-item.types';
import { ICategory, TCategoryId } from '../../model/category.types';
import { TItemListId } from '../../model/item-list.types';
import { categoriesByIds } from '../../util/categories/category.utils';
import { requireUniqueName } from '../../util/form-rules';
import {
  ItemDialogService,
  TItemDialogRequest,
} from '../../util/item-dialog.service';

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
 * the domain-blind open-command off {@link ItemDialogService}, keep the edit
 * draft LOCAL (no per-keystroke dispatch), and save via the domain's own facade
 * command on confirm.
 *
 * The per-domain differences are abstract members the subclass supplies from its
 * DOMAIN facade: the `listId` it answers to, the `siblings` signal the name rule
 * compares against, the `save` command and a `blank()` for the closed state. This
 * keeps NgRx sealed in the data layer — neither the base nor the subclass injects
 * `Store`. Domain-specific field updaters (quantity, prio, …) stay in the
 * subclass — different fields, nothing to share. Angular does not inherit
 * `@Component` metadata, so each wrapper still declares its own imports/template.
 */
export abstract class BaseEditItemDialog<T extends IBaseItem> {
  protected readonly host = inject(ItemDialogService);

  protected abstract readonly listId: TItemListId;
  /**
   * The items the edited one has to stay distinct from: **the whole aggregate**,
   * never a page's filtered view of it. Feeding a filtered signal here silently
   * narrows the rule — with a search term or category filter left on the list
   * page, the shrunken set no longer contains the twin and the duplicate saves.
   */
  abstract readonly siblings: Signal<readonly T[]>;
  protected abstract save(item: T): void;
  /**
   * The shape the draft holds while no edit is open — a real, valid entity from
   * the domain's own factory, so this class never authors a second answer to
   * "what does a fresh one look like".
   *
   * Needed because a Signal Forms tree cannot be built over `T | undefined` — its
   * rules would run against nothing the moment the dialog closed. So "closed" is
   * modelled by {@link isOpen} alone, as it always was, and the draft is simply
   * never absent. The blank is never saved: `confirm()` is only reachable from an
   * open dialog, which is always seeded.
   */
  protected abstract blank(): T;

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
  readonly draft = linkedSignal<T>(() => {
    const item = this.seedItem();
    return item ? { ...item } : this.blank();
  });

  /**
   * The field tree over {@link draft}, carrying the one rule every list item
   * obeys: a filled-in name no sibling already has.
   *
   * The BASE owns it, not the subclass. Six wrappers each declaring
   * `form(this.draft, rules)` meant six copies of the same `requireUniqueName`
   * call, and a seventh that simply omitted it would have compiled — permanently
   * saveable, happily persisting `name: '   '` for `persist()` to trim to `''`.
   * An invariant every subclass must hold is not a subclass's decision.
   *
   * `form()` evaluates its schema **eagerly**, at field-initialization time, when
   * a subclass's own fields do not exist yet — which is why `requireUniqueName`
   * takes thunks. It also rules out an `extraRules` *field* hook, so if a dialog
   * ever needs its own rule the hook has to be a prototype **method**.
   */
  readonly form = form(this.draft, (path) => {
    // `T` is generic here, so its mapped path type stays deferred and `path.name`
    // is unreachable; `T extends IBaseItem` is what makes the narrowing sound.
    const { name } = path as SchemaPathTree<IBaseItem>;
    requireUniqueName(
      name,
      () => this.siblings(),
      () => this.seedItem()
    );
  });

  /**
   * Saveable = the field tree is valid — the same derivation `BaseModalDialog`
   * makes, so both dialog families now read validity from a schema instead of the
   * shell reading it off the name input.
   */
  readonly canSave = computed(() => this.form().valid());

  constructor() {
    addIcons({ closeCircle });
  }

  /**
   * Protected, unlike `BaseModalDialog.patch` — there a template genuinely binds
   * it (`game-edit-modal`), here no template does. A spec that needs to set a
   * field drives `form.<field>().value.set(...)`, the way the control would.
   */
  protected patch(partial: Partial<T>) {
    this.draft.update((draft) => ({ ...draft, ...partial }));
  }

  confirm() {
    if (!this.canSave()) {
      return;
    }
    this.save(this.draft());
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
    categoriesByIds(this.draft().categoryIds, this.categories())
  );

  // Domain catalog commands the subclass wires to its own facade. Kept `void`
  // (not action factories) so no NgRx leaks into the wrapper.
  protected abstract addCategoryToCatalog(category: ICategory): void;
  protected abstract removeCategoryFromCatalog(categoryId: TCategoryId): void;
  protected abstract renameCategoryInCatalog(id: TCategoryId, to: string): void;

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
    this.addCategoryToCatalog(category);
  }

  // Catalog delete (picker swipe): remove it from the domain catalog (cascades
  // to every item) and from the local draft so this item stays consistent
  // pre-save.
  deleteCategory(categoryId: TCategoryId) {
    this.removeCategoryFromCatalog(categoryId);
    this.#dropFromDraft(categoryId);
  }

  // Rename is O(1) on the catalog; items reference by id, so the draft is
  // unchanged.
  renameCategory({ id, to }: { id: TCategoryId; to: string }) {
    this.renameCategoryInCatalog(id, to);
  }

  #dropFromDraft(categoryId: TCategoryId) {
    this.patch({
      categoryIds: (this.draft().categoryIds ?? []).filter(
        (id) => id !== categoryId
      ),
    } as Partial<T>);
  }
}
