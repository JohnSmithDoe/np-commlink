import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonNote,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';
import { TColor, TItemListSortType } from '../../../@shared/model/types';
import { IStorageItem } from '../../model';
import { GroceryListPageFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { ItemListQuickaddComponent } from '../../smart-ui/item-list-quick-add/item-list-quickadd.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/item-list/item-list-items/list-item/list-item.component';
import { BarcodeScannerService } from '../../../@shared/util/barcode/barcode-scanner.service';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';
import { EditStorageItemDialogComponent } from '../edit-storage-item-dialog/edit-storage-item-dialog.component';

@Component({
  selector: 'app-page-storage',
  templateUrl: 'storage.page.html',
  styleUrls: ['storage.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    DatePipe,
    IonButton,
    IonIcon,
    IonNote,
    ListPageComponent,
    ItemListQuickaddComponent,
    GrocerySearchResultComponent,
    ListItemComponent,
    EditStorageItemDialogComponent,
    EditProductDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GroceryListPageFacade }],
})
export class StoragePage implements ViewWillEnter {
  readonly #route = inject(ActivatedRoute);
  readonly #scanner = inject(BarcodeScannerService);
  readonly facade = inject(GroceryListPageFacade);

  readonly showScanButton = this.#scanner.isNativePlatform;

  constructor() {
    addIcons({ barcodeOutline });
  }

  async scan() {
    const ean = await this.#scanner.scanEan();
    if (ean) {
      this.facade.openEditProduct(ean);
    }
  }

  ionViewWillEnter(): void {
    this.facade.enterStorage();
    // Category→items drill (see shopping.page for the timing rationale).
    const filter = this.#route.snapshot.queryParamMap.get('filter');
    if (filter) this.facade.filterStorage(filter);
  }

  removeItem(item: IStorageItem) {
    this.facade.removeStorageItem(item);
  }

  showEditDialog(item: IStorageItem) {
    this.facade.showEditStorageItem(item);
  }

  setSortMode(type: TItemListSortType) {
    this.facade.setStorageSort(type);
  }

  changeQuantity(item: IStorageItem, diff: number) {
    this.facade.changeStorageQuantity(item, diff);
  }

  copyToShoppingList(item: IStorageItem) {
    this.facade.copyStorageToShopping(item);
  }

  getItemStatusColor(item: IStorageItem): TColor {
    if (!item.minAmount) {
      return 'success';
    }

    if (item.quantity < item.minAmount) {
      return 'danger';
    }

    if (item.quantity === item.minAmount) {
      return 'warning';
    }

    return 'success';
  }
}
