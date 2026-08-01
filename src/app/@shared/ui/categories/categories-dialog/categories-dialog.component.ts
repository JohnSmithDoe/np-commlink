import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSearchbar,
  IonToolbar,
  SearchbarCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkOutline, createOutline, trashOutline } from 'ionicons/icons';
import {
  matcherFor,
  matchesSearchExactly,
  uuidv4,
} from '../../../util/app.utils';
import { ICategory, TCategoryId } from '../../../model/category.types';

/**
 * Pure presentational (type:ui) category picker — one custom selectable list
 * reused by every domain. Categories are first-class {id,name} objects: the
 * picker takes the domain's `categories` catalog + the current `selection` (a
 * list of category IDS), and emits IDs. It knows no store and no domain: the
 * feature wrapper folds the confirmed ids into its draft and turns
 * `addNew`/`deleted`/`renamed` into its own slice ops.
 *
 * Modes (from `multiple`): **multi** — tap a row toggles a checkmark, the
 * Confirm button commits the whole id array (grocery items). **single** — tap a
 * row picks it and confirms immediately, no Confirm button (a cash transaction
 * has one category). Rows are `ion-item-sliding`; swipe reveals inline **rename**
 * + **delete**, so the catalog is managed right where it's assigned.
 *
 * `addNew` emits a freshly-MINTED `{id,name}` (the picker generates the id) so a
 * typed-new category can be selected immediately AND the domain gets a single id
 * to persist (grocery fans that one id across its three lists).
 */
@Component({
  selector: 'app-categories-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-dialog.component.html',
  imports: [
    TranslatePipe,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonContent,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonNote,
    IonIcon,
    IonInput,
  ],
})
export class CategoriesDialogComponent {
  readonly isOpen = input<boolean>(false);
  readonly categories = input<ICategory[]>([]);
  readonly selection = input<TCategoryId[]>([]);
  // false = single-select (tap picks + confirms, no Confirm button).
  readonly multiple = input(true, { transform: booleanAttribute });

  readonly confirmed = output<TCategoryId[]>();
  readonly cancelled = output<void>();
  readonly dismissed = output<void>();
  readonly addNew = output<ICategory>();
  readonly deleted = output<TCategoryId>();
  readonly renamed = output<{ id: TCategoryId; to: string }>();

  // viewChild can't sit on an ES-private (#) field (NG1053); public readonly,
  // matching the item-list convention.
  readonly list = viewChild<IonList>('list');

  readonly searchQuery = signal<string>('');

  // Transient in-progress selection (ids): reset to the incoming selection each
  // time the picker (re)opens, so a cancel discards uncommitted toggles.
  readonly selected = linkedSignal<boolean, TCategoryId[]>({
    source: () => this.isOpen(),
    computation: () => this.selection(),
  });

  // The id of the category being renamed inline (null = none) + its working text.
  readonly editing = signal<TCategoryId | null>(null);
  readonly renameText = signal<string>('');

  readonly filteredCategories = computed<ICategory[]>(() => {
    const query = this.searchQuery();
    const all = this.categories();
    if (query.length === 0) return all;
    const matches = matcherFor(query);
    return all.filter((cat) => matches(cat.name));
  });

  // True when the typed query already names an existing category (so we hide the
  // "create «X»" row).
  readonly searchContained = computed<boolean>(() => {
    const query = this.searchQuery();
    return (
      query.length > 0 &&
      this.categories().some((cat) => matchesSearchExactly(cat.name, query))
    );
  });

  constructor() {
    addIcons({ checkmarkOutline, createOutline, trashOutline });
  }

  searchbarInput(event: SearchbarCustomEvent) {
    this.searchQuery.set(event.detail.value ?? '');
  }

  isChecked(cat: ICategory): boolean {
    return this.selected().includes(cat.id);
  }

  // Row tap: multi toggles the checkmark; single picks + confirms at once.
  rowClick(cat: ICategory) {
    if (this.editing() !== null) return;
    if (this.multiple()) {
      this.selected.update((current) =>
        current.includes(cat.id)
          ? current.filter((id) => id !== cat.id)
          : [cat.id, ...current]
      );
    } else {
      this.confirmed.emit([cat.id]);
    }
  }

  confirmMultiple() {
    this.confirmed.emit(this.selected());
  }

  addNewCategory() {
    const name = this.searchQuery().trim();
    if (name.length === 0) return;
    // If the name already exists (case-insensitive), select THAT category rather
    // than minting a duplicate — the domain dedupes by name, so a fresh id would
    // be dropped and leave the item pointing at a non-existent category. Only a
    // genuinely-new name mints an id (and is persisted via addNew).
    const existing = this.categories().find((cat) =>
      matchesSearchExactly(cat.name, name)
    );
    const category: ICategory = existing ?? { id: uuidv4(), name };
    if (!existing) this.addNew.emit(category);
    if (this.multiple()) {
      if (!this.selected().includes(category.id)) {
        this.selected.update((current) => [category.id, ...current]);
      }
      this.searchQuery.set('');
    } else {
      this.confirmed.emit([category.id]);
      this.searchQuery.set('');
    }
  }

  async startEdit(cat: ICategory) {
    this.editing.set(cat.id);
    this.renameText.set(cat.name);
    await this.list()?.closeSlidingItems();
  }

  commitEdit() {
    const id = this.editing();
    const to = this.renameText().trim();
    this.editing.set(null);
    if (!id || !to) return;
    this.renamed.emit({ id, to });
  }

  cancelEdit() {
    this.editing.set(null);
  }

  async deleteCategory(cat: ICategory) {
    await this.list()?.closeSlidingItems();
    this.deleted.emit(cat.id);
    this.selected.update((current) => current.filter((id) => id !== cat.id));
  }
}
