import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IBaseItem, ICategory } from '../../../@shared/types';
import {
  IGrocerySearchResult,
  IProduct,
  IShoppingItem,
  IStorageItem,
} from '../../model';
import { CategoriesPipe } from '../../../@shared/util/categories.pipe';
import { TextItemComponent } from '../../../@shared/ui/item-list-items/text-item/text-item.component';
import { ItemListComponent } from '../../../@shared/ui/item-list/item-list.component';

@Component({
  selector: 'app-grocery-search-result',
  templateUrl: './grocery-search-result.component.html',
  styleUrls: ['./grocery-search-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemListComponent,
    TextItemComponent,
    CategoriesPipe,
    TranslateModule,
  ],
})
export class GrocerySearchResultComponent<T extends IBaseItem> {
  results = input<IGrocerySearchResult<T> | null>();
  // The grocery catalog, so search-result rows resolve category ids → names.
  catalog = input<readonly ICategory[]>([]);
  selectProduct = output<IProduct>();
  selectShoppingItem = output<IShoppingItem>();
  selectStorageItem = output<IStorageItem>();
}
