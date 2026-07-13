import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IProduct, IonViewWillEnter } from '../../../@shared/types';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GroceryListPageFacade } from '../../data/grocery-list/grocery-list-page.facade';
import { LIST_FACADE } from '../../../@shared/data/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import { ListItemComponent } from '../../../@shared/ui/item-list-items/list-item/list-item.component';
import { ProductsActions } from '../../data/products.actions';
import { EditProductDialogComponent } from '../../smart-ui/edit-product-dialog/edit-product-dialog.component';

@Component({
  // selector kept as `app-page-products` for cosmetic continuity (kitchen-bot).
  selector: 'app-page-products',
  templateUrl: 'products.page.html',
  styleUrls: ['products.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ListPageComponent,
    GrocerySearchResultComponent,
    ListItemComponent,
    EditProductDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GroceryListPageFacade }],
})
export class ProductsPage implements IonViewWillEnter {
  readonly #store = inject(Store);
  readonly facade = inject(GroceryListPageFacade);

  ionViewWillEnter(): void {
    this.#store.dispatch(ProductsActions.enterPage());
  }

  removeItem(item: IProduct) {
    this.#store.dispatch(ProductsActions.removeItem(item));
  }

  showEditDialog(item: IProduct) {
    this.#store.dispatch(ItemDialogsActions.showEditDialog(item, '_products'));
  }
}
