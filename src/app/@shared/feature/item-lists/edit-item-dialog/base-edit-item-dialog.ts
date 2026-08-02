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
import { requireUniqueName } from '../../../util/forms/form-rules';
import {
  ItemDialogService,
  ItemDialogRequest,
} from '../../../util/item-lists/item-dialog.service';

const DIALOG_TITLE: Readonly<Record<EditItemMode, Marker>> = {
  update: marker('edit.item.dialog.title.update'),
  create: marker('edit.item.dialog.title.create'),
};
const SAVE_BUTTON: Readonly<Record<EditItemMode, Marker>> = {
  update: marker('edit.item.dialog.button.update'),
  create: marker('edit.item.dialog.button.create'),
};

export abstract class BaseEditItemDialog<T extends BaseItem> {
  protected readonly host = inject(ItemDialogService);
  readonly #emojiRecents = inject(EmojiRecentsFacade);

  protected abstract readonly listId: ItemListId;
  abstract readonly siblings: Signal<readonly T[]>;
  protected abstract save(item: T): void;
  protected abstract blank(): T;

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
  readonly seedItem = computed(() => this.#request()?.item);
  readonly closeButtonText: Marker = marker('edit.item.dialog.button.close');
  readonly saveButtonText = computed(() => SAVE_BUTTON[this.#editMode()]);
  readonly dialogTitle = computed(() => DIALOG_TITLE[this.#editMode()]);

  protected readonly addToAdditionalList = computed(
    () => this.#request()?.addToAdditionalList
  );

  readonly draft = linkedSignal<T>(() => {
    const item = this.seedItem();
    return item ? { ...item } : this.blank();
  });

  readonly form = form(this.draft, (path) => {
    const { name } = path as SchemaPathTree<BaseItem>;
    requireUniqueName(
      name,
      () => this.siblings(),
      () => this.seedItem()
    );
  });

  readonly canSave = computed(() => this.form().valid());

  constructor() {
    addIcons({ closeCircle });
  }

  protected patch(partial: Partial<T>) {
    this.draft.update((draft) => ({ ...draft, ...partial }));
  }

  confirm() {
    if (!this.canSave()) {
      return;
    }
    const item = this.draft();
    this.save(item);
    this.#emojiRecents.remember(extractEmoji(item.name));
    this.host.close();
  }

  close() {
    this.host.close();
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
