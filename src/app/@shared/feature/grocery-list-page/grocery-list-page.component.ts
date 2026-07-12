import { Component, inject, Input, TemplateRef } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, bagAdd, clipboard, remove } from 'ionicons/icons';
import {
  IAppState,
  IGlobalItem,
  IShoppingItem,
  IStorageItem,
  TAllItemTypes,
  TColor,
  TItemListCategory,
  TItemListId,
  TItemListMode,
  TItemListSortType,
} from '../../types';
import { GroceryListActions } from '../../data/grocery-list/grocery-list.actions';
import {
  selectListCategories,
  selectListItems,
  selectListSearchResult,
  selectListState,
  selectListStateFilter,
} from '../../data/grocery-list/grocery-list.selector';
import { ItemDialogsActions } from '../../data/item-dialogs/item-dialogs.actions';
import { ItemListEmptyComponent } from '../../ui/item-list/item-list-empty/item-list-empty.component';
import { ItemListQuickaddComponent } from '../../smart-ui/item-list-quick-add/item-list-quickadd.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import { ItemListSearchbarComponent } from '../../ui/item-list/item-list-searchbar/item-list-searchbar.component';
import { ItemListToolbarComponent } from '../../ui/item-list/item-list-toolbar/item-list-toolbar.component';
import { ItemListComponent } from '../../ui/item-list/item-list.component';
import { PageHeaderComponent } from '../../ui/page-header/page-header.component';
import { EditCategoryDialogComponent } from '../../smart-ui/edit-category-dialog/edit-category-dialog.component';

@Component({
  selector: 'app-grocery-list-page',
  templateUrl: './grocery-list-page.component.html',
  styleUrls: ['./grocery-list-page.component.scss'],
  imports: [
    IonContent,
    ItemListComponent,
    ItemListEmptyComponent,
    ItemListQuickaddComponent,
    GrocerySearchResultComponent,
    ItemListSearchbarComponent,
    ItemListToolbarComponent,
    PageHeaderComponent,
    EditCategoryDialogComponent,
    TranslateModule,
  ],
})
export class GroceryListPageComponent<T extends TAllItemTypes> {
  readonly #store = inject(Store<IAppState>);

  @Input({ required: true }) listId!: TItemListId;
  @Input({ required: true }) itemTemplate!: TemplateRef<any>;
  // Optional: grocery pages omit this for uniform amber chrome (per-domain
  // identity lives on the commlink deck tiles). When unset, page-header +
  // item-list fall back to the default shadowrun toolbar styling.
  @Input() color?: TColor;
  @Input({ required: true }) listHeader!: string;
  @Input({ required: true }) pageHeader!: string;

  rxState = this.#store.selectSignal(selectListState);
  rxFilter = this.#store.selectSignal(selectListStateFilter);
  rxItems = this.#store.selectSignal(selectListItems);
  rxSearchResult = this.#store.selectSignal(selectListSearchResult);
  rxCategories = this.#store.selectSignal(selectListCategories);

  constructor() {
    addIcons({ add, remove, clipboard, bagAdd });
  }

  addItemFromSearch() {
    this.#store.dispatch(GroceryListActions.addItemFromSearch(this.listId));
  }

  addCategoryFromSearch() {
    this.#store.dispatch(GroceryListActions.addCategoryFromSearch(this.listId));
  }

  searchFor(searchTerm?: string) {
    this.#store.dispatch(
      GroceryListActions.updateSearch(this.listId, searchTerm)
    );
  }

  setDisplayMode(mode: TItemListMode) {
    this.#store.dispatch(GroceryListActions.updateMode(this.listId, mode));
  }

  setSortMode(type: TItemListSortType) {
    this.#store.dispatch(
      GroceryListActions.updateSort(this.listId, type, 'toggle')
    );
  }

  selectCategory(category: TItemListCategory) {
    this.#store.dispatch(
      GroceryListActions.updateFilter(this.listId, category)
    );
  }

  deleteCategory(category: TItemListCategory) {
    this.#store.dispatch(
      GroceryListActions.removeCategory(this.listId, category)
    );
  }

  addCategory(category: TItemListCategory) {
    this.#store.dispatch(GroceryListActions.addCategory(this.listId, category));
  }

  addGlobalItem(item: IGlobalItem) {
    this.#store.dispatch(GroceryListActions.addGlobalItem(this.listId, item));
  }

  addStorageItem(item: IStorageItem) {
    this.#store.dispatch(GroceryListActions.addStorageItem(this.listId, item));
  }

  addShoppingItem(item: IShoppingItem) {
    this.#store.dispatch(GroceryListActions.addShoppingItem(this.listId, item));
  }

  showCreateDialog() {
    this.#store.dispatch(
      ItemDialogsActions.showCreateDialogWithSearch(this.listId)
    );
  }

  showCreateGlobalDialog() {
    this.#store.dispatch(
      ItemDialogsActions.showCreateAndAddGlobalDialog(this.listId)
    );
  }

  showEditDialog(item: IShoppingItem) {
    this.#store.dispatch(ItemDialogsActions.showEditDialog(item, this.listId));
  }
}
