import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonNote,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';
import { TColor, TItemListSortType } from '../../../@shared/types';
import { IStorageItem } from '../../model';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GroceryListPageFacade, StorageActions } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { ItemListQuickaddComponent } from '../../smart-ui/item-list-quick-add/item-list-quickadd.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import { ListItemComponent } from '../../../@shared/ui/item-list-items/list-item/list-item.component';
import { BarcodeScannerService } from '../../../@shared/util/barcode-scanner.service';
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
  readonly #store = inject(Store);
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
    this.#store.dispatch(StorageActions.enterPage());
    // Category→items drill (see shopping.page for the timing rationale).
    const filter = this.#route.snapshot.queryParamMap.get('filter');
    if (filter) this.#store.dispatch(StorageActions.updateFilter(filter));
  }

  removeItem(item: IStorageItem) {
    this.#store.dispatch(StorageActions.removeItem(item));
  }

  showEditDialog(item: IStorageItem) {
    this.#store.dispatch(ItemDialogsActions.showEditDialog(item, '_storage'));
  }

  setSortMode(type: TItemListSortType) {
    this.#store.dispatch(StorageActions.updateSort(type, 'toggle'));
  }

  changeQuantity(item: IStorageItem, diff: number) {
    this.#store.dispatch(
      StorageActions.updateItem({
        ...item,
        quantity: Math.max(0, item.quantity + diff),
      })
    );
  }

  copyToShoppingList(item: IStorageItem) {
    this.#store.dispatch(StorageActions.copyToShoppinglist(item));
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
