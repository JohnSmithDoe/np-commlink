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
import { Category, CategoryId } from '../../../model/category.types';

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
  readonly categories = input<Category[]>([]);
  readonly selection = input<CategoryId[]>([]);
  readonly multiple = input(true, { transform: booleanAttribute });

  readonly confirmed = output<CategoryId[]>();
  readonly cancelled = output<void>();
  readonly dismissed = output<void>();
  readonly addNew = output<Category>();
  readonly deleted = output<CategoryId>();
  readonly renamed = output<{ id: CategoryId; to: string }>();

  readonly list = viewChild<IonList>('list');

  readonly searchQuery = signal<string>('');

  readonly selected = linkedSignal<boolean, CategoryId[]>({
    source: () => this.isOpen(),
    computation: () => this.selection(),
  });

  readonly editing = signal<CategoryId | null>(null);
  readonly renameText = signal<string>('');

  readonly filteredCategories = computed<Category[]>(() => {
    const query = this.searchQuery();
    const all = this.categories();
    if (query.length === 0) return all;
    const matches = matcherFor(query);
    return all.filter((cat) => matches(cat.name));
  });

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

  isChecked(cat: Category): boolean {
    return this.selected().includes(cat.id);
  }

  rowClick(cat: Category) {
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
    const existing = this.categories().find((cat) =>
      matchesSearchExactly(cat.name, name)
    );
    const category: Category = existing ?? { id: uuidv4(), name };
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

  async startEdit(cat: Category) {
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

  async deleteCategory(cat: Category) {
    await this.list()?.closeSlidingItems();
    this.deleted.emit(cat.id);
    this.selected.update((current) => current.filter((id) => id !== cat.id));
  }
}
