import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonNote,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';
import { TColor } from '../../../@shared/model/app.types';
import { IStorageItem } from '../../model/grocery-list.types';
import { GroceryListPageFacade } from '../../data';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ItemListQuickAddComponent } from '../../smart-ui/item-list-quick-add/item-list-quick-add.component';
import { GrocerySearchResultComponent } from '../../ui/grocery-search-result/grocery-search-result.component';
import {
  ListItemComponent,
  TStartSwipeAction,
} from '../../../@shared/ui/base-item/list-item/list-item.component';
import { EditProductDialogComponent } from '../edit-product-dialog/edit-product-dialog.component';
import { EditStorageItemDialogComponent } from '../edit-storage-item-dialog/edit-storage-item-dialog.component';

@Component({
  selector: 'app-page-storage',
  templateUrl: 'storage.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    DatePipe,
    IonButton,
    IonIcon,
    IonNote,
    ListPageComponent,
    ItemListQuickAddComponent,
    GrocerySearchResultComponent,
    ListItemComponent,
    EditStorageItemDialogComponent,
    EditProductDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GroceryListPageFacade }],
})
export class StoragePage implements ViewWillEnter {
  readonly #route = inject(ActivatedRoute);
  readonly facade = inject(GroceryListPageFacade);

  /** Names the start-swipe action, which here copies the item onto the shopping
   *  list — the same swipe, a different verb than shopping's, which is why the
   *  shared row cannot own this wording. */
  readonly startSwipeAction: TStartSwipeAction = {
    labelKey: marker('grocery.a11y.to-shopping-list'),
    icon: 'cart',
  };

  constructor() {
    addIcons({ barcodeOutline });
  }

  ionViewWillEnter(): void {
    // Category→items drill (see shopping.page for the timing rationale).
    const filter = this.#route.snapshot.queryParamMap.get('filter');
    if (filter) this.facade.selectCategory(filter);
  }

  removeItem(item: IStorageItem) {
    this.facade.removeStorageItem(item);
  }

  showEditDialog(item: IStorageItem) {
    this.facade.showEditStorageItem(item);
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
