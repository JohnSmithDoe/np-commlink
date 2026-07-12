import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonButton, IonIcon, IonNote } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';
import {
  IonViewWillEnter,
  IStorageItem,
  TColor,
  TItemListSortType,
} from '../../../@shared/types';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GroceryListPageComponent } from '../../../@shared/feature/grocery-list-page/grocery-list-page.component';
import { ListItemComponent } from '../../../@shared/ui/item-list-items/list-item/list-item.component';
import { BarcodeScannerService } from '../../../@shared/util/barcode-scanner.service';
import { EditGlobalItemDialogComponent } from '../../../globals/smart-ui/edit-global-item-dialog/edit-global-item-dialog.component';
import { StorageActions } from '../../data/storage.actions';
import { EditStorageItemDialogComponent } from '../../smart-ui/edit-storage-item-dialog/edit-storage-item-dialog.component';

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
    GroceryListPageComponent,
    ListItemComponent,
    EditStorageItemDialogComponent,
    EditGlobalItemDialogComponent,
  ],
})
export class StoragePage implements IonViewWillEnter {
  readonly #store = inject(Store);
  readonly #scanner = inject(BarcodeScannerService);

  readonly showScanButton = this.#scanner.isNativePlatform;

  constructor() {
    addIcons({ barcodeOutline });
  }

  async scan() {
    const ean = await this.#scanner.scanEan();
    if (ean) {
      this.#store.dispatch(ItemDialogsActions.openEditGlobalItem(ean));
    }
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(StorageActions.enterPage());
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
