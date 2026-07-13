import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, remove } from 'ionicons/icons';
import {
  TColor,
  TItemListCategory,
  TItemListMode,
  TItemListSortType,
} from '../../types';
import { LIST_FACADE } from '../../data/list/list-page.facade';
import { ItemListEmptyComponent } from '../../ui/item-list/item-list-empty/item-list-empty.component';
import { ItemListQuickaddComponent } from '../../smart-ui/item-list-quick-add/item-list-quickadd.component';
import { ItemListSearchbarComponent } from '../../ui/item-list/item-list-searchbar/item-list-searchbar.component';
import { ItemListToolbarComponent } from '../../ui/item-list/item-list-toolbar/item-list-toolbar.component';
import { ItemListComponent } from '../../ui/item-list/item-list.component';
import { PageHeaderComponent } from '../../ui/page-header/page-header.component';
import { EditCategoryDialogComponent } from '../../smart-ui/edit-category-dialog/edit-category-dialog.component';

/**
 * Domain-blind list page shell: page-header + searchbar + toolbar, quick-add,
 * item-list, empty state and category dialog. It knows no list identity — the
 * active list's signals and dispatch live behind the injected {@link LIST_FACADE}
 * a consumer domain provides. Grocery pages project their cross-list search
 * buckets into the `[searchExtras]` slot; tasks omits it.
 */
@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
  imports: [
    IonContent,
    ItemListComponent,
    ItemListEmptyComponent,
    ItemListQuickaddComponent,
    ItemListSearchbarComponent,
    ItemListToolbarComponent,
    PageHeaderComponent,
    EditCategoryDialogComponent,
    TranslateModule,
  ],
})
export class ListPageComponent {
  readonly facade = inject(LIST_FACADE);

  @Input({ required: true }) itemTemplate!: TemplateRef<any>;
  // Optional: grocery pages omit this for uniform amber chrome (per-domain
  // identity lives on the commlink deck tiles). When unset, page-header +
  // item-list fall back to the default shadowrun toolbar styling.
  @Input() color?: TColor;
  @Input({ required: true }) listHeader!: string;
  @Input({ required: true }) pageHeader!: string;

  // Passthrough for the quick-add "create global/catalog item" affordance —
  // a grocery-only concern the page stays blind to. Grocery pages bind it to
  // their facade's showCreateGlobalDialog(); tasks never fires it.
  @Output() quickCreateGlobal = new EventEmitter<void>();

  constructor() {
    addIcons({ add, remove });
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

  selectCategory(category: TItemListCategory) {
    this.facade.selectCategory(category);
  }

  deleteCategory(category: TItemListCategory) {
    this.facade.deleteCategory(category);
  }

  showCreateDialog() {
    this.facade.showCreateDialog();
  }
}
