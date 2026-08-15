/* ─── why ─────────────────────────────────────────────────────────
 * `isKnownEmpty` exists because a list has THREE states and the empty
 * shell answers for one: `items()` is `undefined` while the answer is
 * unknown and `[]` once it is known to hold nothing. `!items()?.length`
 * collapsed the two, so "tap here to add something" rendered over data
 * that had not arrived yet.
 *
 * `extraFilters` reads `state().items` for the same reason reversed:
 * `items()` is the list after filtering, so asking it whether anything
 * lacks a category answers "no" the moment any filter is armed — the
 * uncategorized chip vanished under the tap that armed it.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, pricetagsOutline, remove } from 'ionicons/icons';
import { CategoryFilterFacade } from '../../../data/item-lists/category-filter.facade';
import { LIST_FACADE } from '../../../util/item-lists/list-page.facade';
import { ITEM_FILTERS } from '../../../util/item-lists/list-filter';
import { CategoryFilterBarComponent } from '../../../ui/base-item/category-filter-bar/category-filter-bar.component';
import { ItemListEmptyComponent } from '../../../ui/base-item/item-list-empty/item-list-empty.component';
import { ItemListSearchbarComponent } from '../../../ui/base-item/item-list-searchbar/item-list-searchbar.component';
import { ItemListToolbarComponent } from '../../../ui/base-item/item-list-toolbar/item-list-toolbar.component';
import {
  ItemListComponent,
  ItemListTemplateContext,
} from '../../../ui/base-item/item-list/item-list.component';
import { PageHeaderComponent } from '../../../ui/page-header/page-header.component';

@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonIcon,
    IonContent,
    IonNote,
    CategoryFilterBarComponent,
    ItemListComponent,
    ItemListEmptyComponent,
    ItemListSearchbarComponent,
    ItemListToolbarComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
})
export class ListPageComponent {
  readonly facade = inject(LIST_FACADE);
  readonly #categoryFilter = inject(CategoryFilterFacade);

  itemTemplate = input.required<TemplateRef<ItemListTemplateContext>>();
  icon = input<string>();
  pageHeader = input('');
  heading = input('');
  backHref = input('');

  readonly canManageCategories = !!this.facade.manageCategories;

  readonly isKnownEmpty = computed(() => this.facade.items()?.length === 0);

  readonly extraFilters = computed(() => {
    const items = this.facade.state()?.items ?? [];
    return ITEM_FILTERS.filter((filter) => filter.isAvailable(items));
  });

  constructor() {
    addIcons({ add, remove, pricetagsOutline });
  }

  manageCategories() {
    this.facade.manageCategories?.();
  }

  clearFilter(): void {
    this.#categoryFilter.clear();
  }
}
