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
 *
 * "Alle" resets through the BOUND facade and not only through the shared
 * clear action, because the page is the one place that knows which list is
 * on screen. Routing it through a broadcast action needed every domain to
 * register a listener, and the two that never did had a chip that stripped
 * the URL and left the list exactly as it was.
 *
 * `windowSize` is DECLARED on the facade beside `searchable`, but the
 * slicing stays here: `items()` is also what `isKnownEmpty`, the search
 * count and a page's own totals read, so a facade handing back a slice would
 * make those answer for the slice. The cap resets when the search query or
 * the armed filter changes — expanding to reach one old row and then
 * clearing the search would otherwise render the whole collection at once.
 *
 * The drag handle is WITHDRAWN under a search, an armed filter or a window
 * that truncates: a reorder reports the ids it can SEE and the reducer
 * writes them back over the whole collection, so a drag over a partial view
 * silently drops every row the view hid.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  TemplateRef,
} from '@angular/core';
import {
  InfiniteScrollCustomEvent,
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, pricetagsOutline, remove } from 'ionicons/icons';
import { CategoryFilterFacade } from '../../../data/item-lists/category-filter.facade';
import {
  LIST_FACADE,
  ListSection,
} from '../../../util/item-lists/list-page.facade';
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
import { UndoButtonComponent } from '../../../smart-ui/undo-button/undo-button.component';

@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonButtons,
    IonIcon,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonNote,
    CategoryFilterBarComponent,
    ItemListComponent,
    ItemListEmptyComponent,
    ItemListSearchbarComponent,
    ItemListToolbarComponent,
    PageHeaderComponent,
    TranslatePipe,
    UndoButtonComponent,
  ],
})
export class ListPageComponent {
  readonly facade = inject(LIST_FACADE);
  readonly #categoryFilter = inject(CategoryFilterFacade);

  readonly itemTemplate =
    input.required<TemplateRef<ItemListTemplateContext>>();
  readonly icon = input<string>();
  readonly pageHeader = input('');
  readonly heading = input('');

  readonly canManageCategories = !!this.facade.manageCategories;
  readonly canReorder = !!this.facade.reorder;

  readonly isKnownEmpty = computed(() => this.facade.items()?.length === 0);

  readonly #shown = linkedSignal<string, number | undefined>({
    source: () => {
      const state = this.facade.state();
      return JSON.stringify([state?.searchQuery, state?.filterBy]);
    },
    computation: () => this.facade.windowSize?.(),
  });

  readonly windowedItems = computed(() => {
    const items = this.facade.items();
    const shown = this.#shown();
    return shown === undefined || !items || items.length <= shown
      ? items
      : items.slice(0, shown);
  });

  readonly hiddenCount = computed(() => {
    const shown = this.#shown();
    if (shown === undefined) return 0;
    return Math.max(0, (this.facade.items()?.length ?? 0) - shown);
  });

  readonly sections = computed<readonly ListSection[]>(
    () => this.facade.sections?.() ?? [{ id: '', items: this.windowedItems() }]
  );

  readonly showSectionHeaders = computed(() => this.sections().length > 1);

  readonly reorderArmed = computed(
    () =>
      this.canReorder &&
      !this.facade.searchResult() &&
      !this.facade.state()?.filterBy &&
      this.hiddenCount() === 0
  );

  async showMore(event: InfiniteScrollCustomEvent): Promise<void> {
    const step = this.facade.windowSize?.();
    if (step) this.#shown.update((shown) => (shown ?? step) + step);
    await event.target.complete();
  }

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
    this.facade.selectCategory?.(undefined);
    this.#categoryFilter.clear();
  }
}
