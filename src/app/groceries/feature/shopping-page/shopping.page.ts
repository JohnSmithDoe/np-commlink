import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonIcon,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';
import { IShoppingItem } from '../../model';
import { GroceryListPageFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { ItemListQuickaddComponent } from '../../smart-ui/item-list-quick-add/item-list-quickadd.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/item-list/item-list-items/list-item/list-item.component';
import { BarcodeScannerService } from '../../../@shared/util/barcode/barcode-scanner.service';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';
import { EditShoppingItemDialogComponent } from '../edit-shopping-item-dialog/edit-shopping-item-dialog.component';
import { ShoppingActionSheetComponent } from '../../smart-ui/shopping-action-sheet/shopping-action-sheet.component';

@Component({
  selector: 'app-page-shopping',
  templateUrl: 'shopping.page.html',
  styleUrls: ['shopping.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    IonButton,
    IonButtons,
    IonIcon,
    ListPageComponent,
    ItemListQuickaddComponent,
    GrocerySearchResultComponent,
    ListItemComponent,
    EditShoppingItemDialogComponent,
    EditProductDialogComponent,
    ShoppingActionSheetComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GroceryListPageFacade }],
})
export class ShoppingPage implements ViewWillEnter {
  readonly #route = inject(ActivatedRoute);
  readonly #scanner = inject(BarcodeScannerService);
  readonly facade = inject(GroceryListPageFacade);
  readonly rxState = this.facade.shoppingState;
  readonly showScanButton = this.#scanner.isNativePlatform;

  constructor() {
    addIcons({ barcodeOutline });
  }

  ionViewWillEnter(): void {
    this.facade.enterShopping();
    // Category→items drill: the manage page navigates here with `?filter=<id>`.
    // Applied after the route resolver's `loaded` (which resets filterBy), so
    // the filter survives the entry.
    const filter = this.#route.snapshot.queryParamMap.get('filter');
    if (filter) this.facade.filterShopping(filter);
  }

  async scan() {
    const ean = await this.#scanner.scanEan();
    if (ean) {
      this.facade.openEditProduct(ean);
    }
  }

  removeItem(item: IShoppingItem) {
    this.facade.removeShoppingItem(item);
  }

  showEditDialog(item: IShoppingItem) {
    this.facade.showEditShoppingItem(item);
  }

  changeQuantity(item: IShoppingItem, diff: number) {
    this.facade.changeShoppingQuantity(item, diff);
  }

  buyItem(item: IShoppingItem) {
    this.facade.buyShoppingItem(item);
  }

  openActionSheet() {
    this.facade.openShoppingActionSheet();
  }
}
