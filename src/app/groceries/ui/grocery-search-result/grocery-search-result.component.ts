import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  IGrocerySearchResult,
  IProduct,
  IShoppingItem,
  IStorageItem,
} from '../../model/grocery-list.types';
import { CategoriesPipe } from '../../util/categories.pipe';
import { TextItemComponent } from '../../../@shared/ui/base-item/text-item/text-item.component';
import { ItemListComponent } from '../../../@shared/ui/base-item/item-list/item-list.component';
import { IBaseItem } from '../../../@shared/model/base-item.types';
import { ICategory } from '../../../@shared/model/category.types';

@Component({
  selector: 'app-grocery-search-result',
  templateUrl: './grocery-search-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemListComponent,
    TextItemComponent,
    CategoriesPipe,
    TranslatePipe,
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
