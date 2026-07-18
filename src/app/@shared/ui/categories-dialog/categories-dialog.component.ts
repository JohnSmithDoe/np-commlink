import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSearchbar,
  IonToolbar,
  CheckboxCustomEvent,
  SearchbarCustomEvent,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TItemListCategory } from '../../types';
import { matchesSearchString } from '../../util/app.utils';

/**
 * Pure presentational (type:ui) category picker — inputs in (open state, the
 * domain's catalog, the current selection), events out (the confirmed
 * selection / cancel / a brand-new category to persist). The transient
 * selection + search live locally; the domain feature wrapper folds the
 * confirmed selection into its draft and persists a new category to its slice.
 * Replaces the store-bound `@shared/smart-ui/categories-dialog`.
 */
@Component({
  selector: 'app-categories-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-dialog.component.html',
  styleUrls: ['./categories-dialog.component.scss'],
  imports: [
    FormsModule,
    TranslateModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonContent,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonNote,
  ],
})
export class CategoriesDialogComponent {
  readonly isOpen = input<boolean>(false);
  readonly categories = input<TItemListCategory[]>([]);
  readonly selection = input<TItemListCategory[]>([]);

  readonly confirmed = output<TItemListCategory[]>();
  readonly cancelled = output<void>();
  readonly dismissed = output<void>();
  readonly addNew = output<TItemListCategory>();

  readonly searchQuery = signal<string>('');

  // Transient in-progress selection: reset to the incoming selection each time
  // the picker (re)opens, so a cancel discards uncommitted toggles.
  readonly selected = linkedSignal<boolean, TItemListCategory[]>({
    source: () => this.isOpen(),
    computation: () => this.selection(),
  });

  readonly filteredCategories = computed<TItemListCategory[]>(() => {
    const query = this.searchQuery();
    const all = this.categories();
    return !query.length
      ? all
      : all.filter((cat) => matchesSearchString(cat, query));
  });

  readonly searchContained = computed<boolean>(() => {
    const query = this.searchQuery();
    return !!query.length && this.filteredCategories().includes(query);
  });

  searchbarInput(ev: SearchbarCustomEvent) {
    this.searchQuery.set(ev.detail.value ?? '');
  }

  isChecked(cat: TItemListCategory): boolean {
    return this.selected().includes(cat);
  }

  selectionChange(ev: CheckboxCustomEvent<TItemListCategory>) {
    const cat = ev.detail.value;
    this.selected.update((current) =>
      current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [cat, ...current]
    );
  }

  addNewCategory() {
    const query = this.searchQuery().trim();
    if (!query.length) return;
    if (!this.selected().includes(query)) {
      this.selected.update((current) => [query, ...current]);
    }
    this.addNew.emit(query);
    this.searchQuery.set('');
  }
}
