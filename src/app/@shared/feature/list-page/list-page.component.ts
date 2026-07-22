import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, pricetagsOutline, remove } from 'ionicons/icons';
import {
  TCategoryId,
  TColor,
  TItemListMode,
  TItemListSortType,
} from '../../types';
import { categoryName } from '../../util/category.utils';
import { LIST_FACADE } from '../../util/list/list-page.facade';
import { ItemListEmptyComponent } from '../../ui/item-list/item-list-empty/item-list-empty.component';
import { ItemListSearchbarComponent } from '../../ui/item-list/item-list-searchbar/item-list-searchbar.component';
import { ItemListToolbarComponent } from '../../ui/item-list/item-list-toolbar/item-list-toolbar.component';
import { ItemListComponent } from '../../ui/item-list/item-list.component';
import { PageHeaderComponent } from '../../ui/page-header/page-header.component';
import { EditCategoryDialogComponent } from '../../smart-ui/edit-category-dialog/edit-category-dialog.component';

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
  styleUrls: ['./list-page.component.scss'],
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
    EditCategoryDialogComponent,
    TranslateModule,
  ],
})
export class ListPageComponent {
  readonly facade = inject(LIST_FACADE);

  itemTemplate = input.required<TemplateRef<any>>();
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

  // The active category filter resolved to a display name (filterBy is a
  // category id now). Empty when no filter is set.
  readonly filterName = computed(() => {
    const state = this.facade.state();
    return categoryName(state?.filterBy, state?.categories ?? []);
  });

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
    this.facade.addItemFromSearch();
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
    this.facade.showCreateDialog();
  }
}
