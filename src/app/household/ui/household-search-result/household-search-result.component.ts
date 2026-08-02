import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  HouseholdSearchResult,
  Product,
  ShoppingItem,
  StorageItem,
} from '../../model/household-list.types';
import { CategoriesPipe } from '../../util/categories.pipe';
import { TextItemComponent } from '../../../@shared/ui/base-item/text-item/text-item.component';
import { ItemListComponent } from '../../../@shared/ui/base-item/item-list/item-list.component';
import { BaseItem } from '../../../@shared/model/base-item.types';
import { Category } from '../../../@shared/model/category.types';

@Component({
  selector: 'app-household-search-result',
  templateUrl: './household-search-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemListComponent,
    TextItemComponent,
    CategoriesPipe,
    TranslatePipe,
  ],
})
export class HouseholdSearchResultComponent {
  readonly results = input<HouseholdSearchResult<BaseItem> | null>();
  readonly catalog = input<readonly Category[]>([]);
  readonly selectProduct = output<Product>();
  readonly selectShoppingItem = output<ShoppingItem>();
  readonly selectStorageItem = output<StorageItem>();
}
