import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IProduct } from '../../model';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GroceryListPageFacade, ProductsActions } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { ItemListQuickaddComponent } from '../../smart-ui/item-list-quick-add/item-list-quickadd.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import { ListItemComponent } from '../../../@shared/ui/item-list-items/list-item/list-item.component';
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
  readonly #store = inject(Store);
  readonly #route = inject(ActivatedRoute);
  readonly facade = inject(GroceryListPageFacade);

  ionViewWillEnter(): void {
    this.#store.dispatch(ProductsActions.enterPage());
    // Category→items drill (see shopping.page for the timing rationale).
    const filter = this.#route.snapshot.queryParamMap.get('filter');
    if (filter) this.#store.dispatch(ProductsActions.updateFilter(filter));
  }

  removeItem(item: IProduct) {
    this.#store.dispatch(ProductsActions.removeItem(item));
  }

  showEditDialog(item: IProduct) {
    this.#store.dispatch(ItemDialogsActions.showEditDialog(item, '_products'));
  }
}
