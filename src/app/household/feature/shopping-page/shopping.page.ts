import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { bagAdd, barcodeOutline, cart } from 'ionicons/icons';
import { ShoppingItem } from '../../model/household-list.types';
import { HouseholdListPageFacade, ShoppingFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ItemListQuickAddComponent } from '../../smart-ui/item-list-quick-add/item-list-quick-add.component';
import { HouseholdScanButtonComponent } from '../../smart-ui/household-scan-button/household-scan-button.component';
import { HouseholdSearchPanelComponent } from '../../smart-ui/household-search-panel/household-search-panel.component';
import { HouseholdListSettingsButtonComponent } from '../../ui/household-list-settings-button/household-list-settings-button.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../@shared/ui/base-item/base-swipe-row';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';
import { EditShoppingItemDialogComponent } from '../edit-shopping-item-dialog/edit-shopping-item-dialog.component';
import { ShoppingActionSheetComponent } from '../../smart-ui/shopping-action-sheet/shopping-action-sheet.component';

@Component({
  selector: 'app-page-shopping',
  templateUrl: 'shopping.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    IonButton,
    IonIcon,
    ListPageComponent,
    ItemListQuickAddComponent,
    HouseholdScanButtonComponent,
    HouseholdSearchPanelComponent,
    HouseholdListSettingsButtonComponent,
    ListItemComponent,
    EditShoppingItemDialogComponent,
    EditProductDialogComponent,
    ShoppingActionSheetComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: HouseholdListPageFacade }],
})
export class ShoppingPage {
  readonly facade = inject(HouseholdListPageFacade);
  readonly #shopping = inject(ShoppingFacade);
  readonly state = this.#shopping.state;
  readonly startSwipeAction: StartSwipeAction = {
    labelKey: marker('household.a11y.buy-item'),
    icon: 'cart',
  };

  constructor() {
    addIcons({ bagAdd, barcodeOutline, cart });
  }

  removeItem(item: ShoppingItem) {
    this.#shopping.removeItem(item);
  }

  showEditDialog(item: ShoppingItem) {
    this.#shopping.showEditDialog(item);
  }

  changeQuantity(item: ShoppingItem, diff: number) {
    this.#shopping.changeQuantity(item, diff);
  }

  buyItem(item: ShoppingItem) {
    this.#shopping.buyItem(item);
  }

  openActionSheet() {
    this.#shopping.openActionSheet();
  }
}
