import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonNote } from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { cartOutline } from 'ionicons/icons';
import { StorageItem } from '../../model/household-list.types';
import { storageStatusColor } from '../../util/household-list.utils';
import { HouseholdListPageFacade, StorageFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ItemListQuickAddComponent } from '../../smart-ui/item-list-quick-add/item-list-quick-add.component';
import { HouseholdSearchPanelComponent } from '../../smart-ui/household-search-panel/household-search-panel.component';
import { SettingsLinkButtonComponent } from '../../../@shared/ui/settings-link-button/settings-link-button.component';
import { LIST_SETTINGS_LABEL } from '../../util/household-list.utils';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../@shared/ui/base-item/base-swipe-row';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';
import { EditStorageItemDialogComponent } from '../edit-storage-item-dialog/edit-storage-item-dialog.component';

@Component({
  selector: 'app-page-storage',
  templateUrl: 'storage.page.html',
  imports: [
    TranslatePipe,
    DatePipe,
    IonNote,
    ListPageComponent,
    ItemListQuickAddComponent,
    HouseholdSearchPanelComponent,
    SettingsLinkButtonComponent,
    ListItemComponent,
    EditStorageItemDialogComponent,
    EditProductDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: HouseholdListPageFacade }],
})
export class StoragePage {
  protected readonly listSettingsLabel = LIST_SETTINGS_LABEL;
  readonly #storage = inject(StorageFacade);

  readonly startSwipeAction: StartSwipeAction = {
    labelKey: marker('household.a11y.to-shopping-list'),
    icon: 'cart-outline',
  };

  readonly statusColor = storageStatusColor;

  constructor() {
    addIcons({ cartOutline });
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
