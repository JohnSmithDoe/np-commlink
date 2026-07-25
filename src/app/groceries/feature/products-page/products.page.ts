import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IProduct } from '../../model';
import { GroceryListPageFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { ItemListQuickaddComponent } from '../../smart-ui/item-list-quick-add/item-list-quickadd.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/item-list/item-list-items/list-item/list-item.component';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';
import { ViewWillEnter } from '@ionic/angular/standalone';

@Component({
  // selector kept as `app-page-products` for cosmetic continuity (kitchen-bot).
  selector: 'app-page-products',
  templateUrl: 'products.page.html',
  styleUrls: ['products.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ListPageComponent,
    ItemListQuickaddComponent,
    GrocerySearchResultComponent,
    ListItemComponent,
    EditProductDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GroceryListPageFacade }],
})
export class ProductsPage implements ViewWillEnter {
  readonly #route = inject(ActivatedRoute);
  readonly facade = inject(GroceryListPageFacade);

  ionViewWillEnter(): void {
    this.facade.enterProducts();
    // Category→items drill (see shopping.page for the timing rationale).
    const filter = this.#route.snapshot.queryParamMap.get('filter');
    if (filter) this.facade.filterProducts(filter);
  }

  removeItem(item: IProduct) {
    this.facade.removeProduct(item);
  }

  showEditDialog(item: IProduct) {
    this.facade.showEditProductItem(item);
  }
}
