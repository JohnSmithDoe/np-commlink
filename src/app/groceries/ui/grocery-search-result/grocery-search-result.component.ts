import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  IBaseItem,
  IProduct,
  ISearchResult,
  IShoppingItem,
  IStorageItem,
} from '../../../@shared/types';
import { CategoriesPipe } from '../../../@shared/util/categories.pipe';
import { TextItemComponent } from '../../../@shared/ui/item-list-items/text-item/text-item.component';
import { ItemListComponent } from '../../../@shared/ui/item-list/item-list.component';

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
  @Output() selectProduct = new EventEmitter<IProduct>();
  @Output() selectShoppingItem = new EventEmitter<IShoppingItem>();
  @Output() selectStorageItem = new EventEmitter<IStorageItem>();
}
