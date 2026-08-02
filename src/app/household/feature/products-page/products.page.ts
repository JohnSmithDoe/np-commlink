import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Product } from '../../model/household-list.types';
import { HouseholdListPageFacade, ProductsFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ItemListQuickAddComponent } from '../../smart-ui/item-list-quick-add/item-list-quick-add.component';
import { HouseholdSearchPanelComponent } from '../../smart-ui/household-search-panel/household-search-panel.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';
import { ViewWillEnter } from '@ionic/angular/standalone';
import { applyCategoryFilterFromRoute } from '../../../@shared/util/item-lists/category-filter.route';

@Component({
  selector: 'app-page-products',
  templateUrl: 'products.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    ListPageComponent,
    ItemListQuickAddComponent,
    HouseholdSearchPanelComponent,
    ListItemComponent,
    EditProductDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: HouseholdListPageFacade }],
})
export class ProductsPage implements ViewWillEnter {
  readonly #route = inject(ActivatedRoute);
  readonly facade = inject(HouseholdListPageFacade);
  readonly #products = inject(ProductsFacade);

  ionViewWillEnter(): void {
    applyCategoryFilterFromRoute(this.#route, this.facade);
  }

  removeItem(item: Product) {
    this.#products.removeItem(item);
  }

  showEditDialog(item: Product) {
    this.#products.showEditDialog(item);
  }
}
