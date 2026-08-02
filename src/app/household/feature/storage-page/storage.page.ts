import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonButton, IonNote, ViewWillEnter } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline, cart } from 'ionicons/icons';
import { StorageItem } from '../../model/household-list.types';
import { storageStatusColor } from '../../util/household-list.utils';
import { HouseholdListPageFacade, StorageFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ItemListQuickAddComponent } from '../../smart-ui/item-list-quick-add/item-list-quick-add.component';
import { HouseholdScanButtonComponent } from '../../smart-ui/household-scan-button/household-scan-button.component';
import { HouseholdSearchPanelComponent } from '../../smart-ui/household-search-panel/household-search-panel.component';
import {
  ListItemComponent,
  StartSwipeAction,
} from '../../../@shared/ui/base-item/list-item/list-item.component';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';
import { EditStorageItemDialogComponent } from '../edit-storage-item-dialog/edit-storage-item-dialog.component';
import { applyCategoryFilterFromRoute } from '../../../@shared/util/item-lists/category-filter.route';

@Component({
  selector: 'app-page-storage',
  templateUrl: 'storage.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    DatePipe,
    IonButton,
    IonNote,
    ListPageComponent,
    ItemListQuickAddComponent,
    HouseholdScanButtonComponent,
    HouseholdSearchPanelComponent,
    ListItemComponent,
    EditStorageItemDialogComponent,
    EditProductDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: HouseholdListPageFacade }],
})
export class StoragePage implements ViewWillEnter {
  readonly #route = inject(ActivatedRoute);
  readonly facade = inject(HouseholdListPageFacade);
  readonly #storage = inject(StorageFacade);

  readonly startSwipeAction: StartSwipeAction = {
    labelKey: marker('household.a11y.to-shopping-list'),
    icon: 'cart',
  };

  readonly statusColor = storageStatusColor;

  constructor() {
    addIcons({ barcodeOutline, cart });
  }

  ionViewWillEnter(): void {
    applyCategoryFilterFromRoute(this.#route, this.facade);
  }

  removeItem(item: StorageItem) {
    this.#storage.removeItem(item);
  }

  showEditDialog(item: StorageItem) {
    this.#storage.showEditDialog(item);
  }

  changeQuantity(item: StorageItem, diff: number) {
    this.#storage.changeQuantity(item, diff);
  }

  copyToShoppingList(item: StorageItem) {
    this.#storage.copyToShoppingList(item);
  }
}
