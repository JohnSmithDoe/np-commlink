/* ─── why ─────────────────────────────────────────────────────────
 * `uniqueName` is a METHOD, not a field. `form` is a field initializer
 * here, and a subclass's fields are assigned only after the base
 * constructor runs — so `uniqueName = false` would still read `true` when
 * the schema is built and the opt-out would silently do nothing. A
 * prototype method exists before any initializer, so an override lands.
 *
 * Opting out drops the duplicate check ALONE, never `requireText`:
 * `addListItem` refuses an empty trimmed name, so a dialog that allowed
 * one would save nothing and report success.
 *
 * `TForm` defaults to `T`, so a dialog whose fields ARE the entity's never
 * meets the second parameter. It exists for the editors where the form
 * genuinely is not the entity — a magnitude plus an expense/income
 * segment over one signed integer, which no binding can bridge. The
 * alternative was a second dialog base, the divergence this one prevents.
 * ───────────────────────────────────────────────────────────────── */
import { computed, inject, linkedSignal, Signal, signal } from '@angular/core';
import { form, SchemaPathTree } from '@angular/forms/signals';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { Marker } from '../../../model/app.types';
import { BaseItem, EditItemMode } from '../../../model/base-item.types';
import { Category, CategoryId } from '../../../model/category.types';
import { ItemListId } from '../../../model/item-list.types';
import { categoriesByIds } from '../../../util/categories/category.utils';
import {
  mergeTargetForRename,
  remapCategoryRef,
} from '../../../util/categories/category-list.utils';
import { EmojiRecentsFacade } from '../../../data/emoji/emoji-recents.facade';
import { extractEmoji } from '../../../util/emoji/emoji-text.utils';
import { requireText, requireUniqueName } from '../../../util/forms/form-rules';
import {
  ItemDialogService,
  ItemDialogRequest,
} from '../../../data/item-lists/item-dialog.service';

const DIALOG_TITLE: Readonly<Record<EditItemMode, Marker>> = {
  update: marker('edit.item.dialog.title.update'),
  create: marker('edit.item.dialog.title.create'),
};
const SAVE_BUTTON: Readonly<Record<EditItemMode, Marker>> = {
  update: marker('edit.item.dialog.button.update'),
  create: marker('edit.item.dialog.button.create'),
};

export abstract class BaseEditItemDialog<
  T extends BaseItem,
  TForm extends { name: string } = T,
> {
  protected readonly host = inject(ItemDialogService);
  readonly #emojiRecents = inject(EmojiRecentsFacade);

  protected abstract readonly listId: ItemListId;
  abstract readonly siblings: Signal<readonly T[]>;
  protected abstract save(item: T): void;
  protected abstract blank(): T;

  protected uniqueName(): boolean {
    return true;
  }

  protected toForm(item: T): TForm {
    return { ...item } as unknown as TForm;
  }

  protected fromForm(draft: TForm, seed: T): T {
    return { ...seed, ...draft } as unknown as T;
  }

  protected extraRules?(path: SchemaPathTree<TForm>): void;

  readonly #request = computed<ItemDialogRequest<T> | null>(() => {
    const request = this.host.request();
    return request?.listId === this.listId
      ? (request as ItemDialogRequest<T>)
      : null;
  });
  readonly #editMode = computed<EditItemMode>(
    () => this.#request()?.editMode ?? 'update'
  );

  readonly isOpen = computed(() => this.#request() !== null);
  readonly isCreateMode = computed(() => this.#editMode() === 'create');
  readonly seedItem = computed(() => this.#request()?.item);
  readonly closeButtonText: Marker = marker('edit.item.dialog.button.close');
  readonly saveButtonText = computed(() => SAVE_BUTTON[this.#editMode()]);
  readonly dialogTitle = computed(() => DIALOG_TITLE[this.#editMode()]);

  protected readonly addToAdditionalList = computed(
    () => this.#request()?.addToAdditionalList
  );

  readonly draft = linkedSignal<TForm>(() =>
    this.toForm(this.seedItem() ?? this.blank())
  );

  readonly form = form(this.draft, (path) => {
    const { name } = path as unknown as SchemaPathTree<BaseItem>;
    if (this.uniqueName()) {
      requireUniqueName(
        name,
        () => this.siblings(),
        () => this.seedItem()
      );
    } else {
      requireText(name);
    }
    this.extraRules?.(path as SchemaPathTree<TForm>);
  });

  readonly canSave = computed(() => this.form().valid());

  constructor() {
    addIcons({ closeCircle });
  }

  protected patch(partial: Partial<TForm>) {
    this.draft.update((draft) => ({ ...draft, ...partial }));
  }

  confirm() {
    if (!this.canSave()) {
      return;
    }
    const item = this.fromForm(this.draft(), this.seedItem() ?? this.blank());
    this.save(item);
    this.#emojiRecents.remember(extractEmoji(item.name));
    this.host.close(this.listId);
  }

  close() {
    this.host.close(this.listId);
  }
}

export abstract class BaseCategoryEditItemDialog<
  T extends BaseItem,
> extends BaseEditItemDialog<T> {
  abstract readonly categories: Signal<readonly Category[]>;

  readonly categoriesDialogOpen = signal(false);

  readonly selectedCategories = computed<Category[]>(() =>
    categoriesByIds(this.draft().categoryIds, this.categories())
  );

  protected abstract addCategoryToCatalog(category: Category): void;
  protected abstract removeCategoryFromCatalog(categoryId: CategoryId): void;
  protected abstract renameCategoryInCatalog(id: CategoryId, to: string): void;

  removeCategory(categoryId: CategoryId) {
    this.#dropFromDraft(categoryId);
  }

  openCategoriesDialog() {
    this.categoriesDialogOpen.set(true);
  }

  confirmCategories(selection: CategoryId[]) {
    this.patch({ categoryIds: selection } as Partial<T>);
    this.categoriesDialogOpen.set(false);
  }

  cancelCategories() {
    this.categoriesDialogOpen.set(false);
  }

  addCategory(category: Category) {
    this.addCategoryToCatalog(category);
  }

  deleteCategory(categoryId: CategoryId) {
    this.removeCategoryFromCatalog(categoryId);
    this.#dropFromDraft(categoryId);
  }

  renameCategory({ id, to }: { id: CategoryId; to: string }) {
    const mergedInto = mergeTargetForRename(this.categories(), id, to);
    this.renameCategoryInCatalog(id, to);
    if (mergedInto) this.#remapInDraft(id, mergedInto);
  }

  #remapInDraft(from: CategoryId, to: CategoryId) {
    const [remapped] = remapCategoryRef([this.draft()], from, to);
    if (remapped) this.draft.set(remapped);
  }

  #dropFromDraft(categoryId: CategoryId) {
    this.patch({
      categoryIds: (this.draft().categoryIds ?? []).filter(
        (id) => id !== categoryId
      ),
    } as Partial<T>);
  }
}
