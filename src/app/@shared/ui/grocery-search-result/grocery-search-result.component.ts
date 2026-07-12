import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  IBaseItem,
  IGlobalItem,
  ISearchResult,
  IShoppingItem,
  IStorageItem,
} from '../../types';
import { CategoriesPipe } from '../../util/categories.pipe';
import { TextItemComponent } from '../item-list-items/text-item/text-item.component';
import { ItemListComponent } from '../item-list/item-list.component';

@Component({
  selector: 'app-grocery-search-result',
  templateUrl: './grocery-search-result.component.html',
  styleUrls: ['./grocery-search-result.component.scss'],
  imports: [
    ItemListComponent,
    TextItemComponent,
    CategoriesPipe,
    TranslateModule,
  ],
})
export class GrocerySearchResultComponent<T extends IBaseItem> {
  @Input() results?: ISearchResult<T> | null;
  @Output() selectGlobalItem = new EventEmitter<IGlobalItem>();
  @Output() selectShoppingItem = new EventEmitter<IShoppingItem>();
  @Output() selectStorageItem = new EventEmitter<IStorageItem>();
}
