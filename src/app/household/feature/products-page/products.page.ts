import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Product } from '../../model/household-list.types';
import { HouseholdListPageFacade, ProductsFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ItemListQuickAddComponent } from '../../smart-ui/item-list-quick-add/item-list-quick-add.component';
import { HouseholdSearchPanelComponent } from '../../smart-ui/household-search-panel/household-search-panel.component';
import { HouseholdListSettingsButtonComponent } from '../../ui/household-list-settings-button/household-list-settings-button.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';

@Component({
  selector: 'app-page-products',
  templateUrl: 'products.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListPageComponent,
    ItemListQuickAddComponent,
    HouseholdSearchPanelComponent,
    HouseholdListSettingsButtonComponent,
    ListItemComponent,
    EditProductDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: HouseholdListPageFacade }],
})
export class ProductsPage {
  readonly facade = inject(HouseholdListPageFacade);
  readonly #products = inject(ProductsFacade);

  removeItem(item: Product) {
    this.#products.removeItem(item);
  }

  showEditDialog(item: Product) {
    this.#products.showEditDialog(item);
  }
}
