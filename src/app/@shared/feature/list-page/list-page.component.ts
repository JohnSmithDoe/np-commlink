import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  TemplateRef,
} from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, pricetagsOutline, remove } from 'ionicons/icons';
import { TColor } from '../../model/app.types';
import { TCategoryId } from '../../model/category.types';
import { TItemListMode, TItemListSortType } from '../../model/item-list.types';
import { categoryName } from '../../util/categories/category.utils';
import { LIST_FACADE } from '../../util/list/list-page.facade';
import { listStateFilter } from '../../util/list/list.selector';
import { ItemListEmptyComponent } from '../../ui/base-item/item-list-empty/item-list-empty.component';
import { ItemListSearchbarComponent } from '../../ui/base-item/item-list-searchbar/item-list-searchbar.component';
import { ItemListToolbarComponent } from '../../ui/base-item/item-list-toolbar/item-list-toolbar.component';
import {
  ItemListComponent,
  ItemListTemplateContext,
} from '../../ui/base-item/item-list/item-list.component';
import { PageHeaderComponent } from '../../ui/page-header/page-header.component';
import { CategoryNameDialogComponent } from '../../ui/categories/category-name-dialog/category-name-dialog.component';

/**
 * Domain-blind list page shell: page-header + searchbar + toolbar, item-list,
 * empty state and category dialog. It knows no list identity — the active list's
 * signals and dispatch live behind the injected {@link LIST_FACADE} a consumer
 * domain provides. The quick-add row is a grocery-only concern the shell stays
 * blind to: grocery pages project their quick-add component into the `[quickAdd]`
 * slot (and their cross-list search buckets into `[searchExtras]`); tracking and
 * tasks project neither.
 */
@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonIcon,
    IonContent,
    ItemListComponent,
    ItemListEmptyComponent,
    ItemListSearchbarComponent,
    ItemListToolbarComponent,
    PageHeaderComponent,
    CategoryNameDialogComponent,
    TranslatePipe,
  ],
})
export class ListPageComponent {
  readonly facade = inject(LIST_FACADE);

  // The name-a-new-category dialog: the seed name while open, null when closed.
  // Local, because it is this shell's own affordance — it used to be a shared
  // NgRx slice plus one guarded bridge effect per domain.
  readonly categoryDialog = signal<string | null>(null);

  itemTemplate = input.required<TemplateRef<ItemListTemplateContext>>();
  // Optional: grocery pages omit this for uniform amber chrome (per-domain
  // identity lives on the commlink deck tiles). When unset, page-header +
  // item-list fall back to the default shadowrun toolbar styling.
  color = input<TColor>();
  // Optional ionicon name shown before the page title (the deck brand look).
  // Tracking sets `timer-outline`; grocery/tasks omit it.
  icon = input<string>();
  listHeader = input.required<string>();
  pageHeader = input.required<string>();
  // Category-less lists (tracking) set this false to render a plain list: it
  // suppresses the quick-add row, the toolbar's display-mode toggle and the
  // edit-category dialog. Grocery + tasks keep the default (true).
  hasCategories = input(true, { transform: booleanAttribute });

  // Which list header the content deserves. A pure function of `state`, so the
  // page derives it rather than asking each domain for the same computation.
  readonly filterState = computed(() => listStateFilter(this.facade.state()));

  // The active category filter resolved to a display name (filterBy is a
  // category id now). Empty when no filter is set.
  readonly filterName = computed(() => {
    const state = this.facade.state();
    return categoryName(state?.filterBy, state?.categories ?? []);
  });

  // In categories display mode BOTH add affordances — the header button and the
  // searchbar's enter key — create a CATEGORY instead of an item. It is a
  // decision about what this shell's buttons mean, so it lives here once; it
  // used to be re-implemented in every list facade and in the grocery engine's
  // routing effect, which is why `IListPageFacade.addItemFromSearch` is now the
  // unconditional item command its name promises.
  readonly #isCategoriesMode = computed(
    () => this.facade.state()?.mode === 'categories'
  );

  constructor() {
    addIcons({ add, remove, pricetagsOutline });
  }

  manageCategories() {
    this.facade.manageCategories?.();
  }

  search(searchTerm?: string) {
    this.facade.search(searchTerm);
  }

  addItemFromSearch() {
    if (this.#isCategoriesMode()) {
      this.addCategoryFromSearch();
    } else {
      this.facade.addItemFromSearch();
    }
  }

  addCategoryFromSearch() {
    this.facade.addCategoryFromSearch();
  }

  setDisplayMode(mode: TItemListMode) {
    this.facade.setDisplayMode(mode);
  }

  setSortMode(type: TItemListSortType) {
    this.facade.setSortMode(type);
  }

  selectCategory(categoryId: TCategoryId) {
    this.facade.selectCategory(categoryId);
  }

  deleteCategory(categoryId: TCategoryId) {
    this.facade.deleteCategory(categoryId);
  }

  showCreateDialog() {
    if (this.#isCategoriesMode()) {
      this.categoryDialog.set(this.facade.state()?.searchQuery ?? '');
    } else {
      this.facade.showCreateDialog();
    }
  }

  saveCategory(name: string) {
    this.categoryDialog.set(null);
    this.facade.saveCategory?.(name);
  }
}
