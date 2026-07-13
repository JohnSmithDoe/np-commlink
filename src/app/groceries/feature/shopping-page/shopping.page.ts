import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';
import { IonViewWillEnter, IShoppingItem } from '../../../@shared/types';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GroceryListPageFacade } from '../../data/grocery-list/grocery-list-page.facade';
import { LIST_FACADE } from '../../../@shared/data/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import { ListItemComponent } from '../../../@shared/ui/item-list-items/list-item/list-item.component';
import { BarcodeScannerService } from '../../../@shared/util/barcode-scanner.service';
import { EditProductDialogComponent } from '../../smart-ui/edit-product-dialog/edit-product-dialog.component';
import { ShoppingActions } from '../../data/shopping.actions';
import { selectShoppingState } from '../../data/shopping.selector';
import { EditShoppingItemDialogComponent } from '../../smart-ui/edit-shopping-item-dialog/edit-shopping-item-dialog.component';
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
    GrocerySearchResultComponent,
    ListItemComponent,
    EditShoppingItemDialogComponent,
    EditProductDialogComponent,
    ShoppingActionSheetComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GroceryListPageFacade }],
})
export class ShoppingPage implements IonViewWillEnter {
  readonly #store = inject(Store);
  readonly #scanner = inject(BarcodeScannerService);
  readonly facade = inject(GroceryListPageFacade);
  readonly rxState = this.#store.selectSignal(selectShoppingState);
  readonly showScanButton = this.#scanner.isNativePlatform;

  constructor() {
    addIcons({ barcodeOutline });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(ShoppingActions.enterPage());
  }

  async scan() {
    const ean = await this.#scanner.scanEan();
    if (ean) {
      this.#store.dispatch(ItemDialogsActions.openEditProduct(ean));
    }
  }

  removeItem(item: IShoppingItem) {
    this.#store.dispatch(ShoppingActions.removeItem(item));
  }

  showEditDialog(item: IShoppingItem) {
    this.#store.dispatch(ItemDialogsActions.showEditDialog(item, '_shopping'));
  }

  changeQuantity(item: IShoppingItem, diff: number) {
    this.#store.dispatch(
      ShoppingActions.updateItem({
        ...item,
        quantity: Math.max(0, item.quantity + diff),
      })
    );
  }

  buyItem(item: IShoppingItem) {
    this.#store.dispatch(ShoppingActions.buyItem(item));
  }

  openActionSheet() {
    this.#store.dispatch(ShoppingActions.showActionSheet());
  }
}
