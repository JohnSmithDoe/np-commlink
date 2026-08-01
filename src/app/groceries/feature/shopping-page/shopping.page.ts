import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonIcon,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';
import { IShoppingItem } from '../../model/grocery-list.types';
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
import { EditShoppingItemDialogComponent } from '../edit-shopping-item-dialog/edit-shopping-item-dialog.component';
import { ShoppingActionSheetComponent } from '../../smart-ui/shopping-action-sheet/shopping-action-sheet.component';

@Component({
  selector: 'app-page-shopping',
  templateUrl: 'shopping.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    IonButton,
    IonButtons,
    IonIcon,
    ListPageComponent,
    ItemListQuickAddComponent,
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
  readonly facade = inject(GroceryListPageFacade);
  readonly state = this.facade.shoppingState;
  /** Names the start-swipe action, which here marks an item bought. A key
   *  declared in a template attribute would be invisible to `i18n:extract
   *  --clean`, since the `translate` pipe applying it is in the shared row. */
  readonly startSwipeAction: TStartSwipeAction = {
    labelKey: marker('grocery.a11y.buy-item'),
    icon: 'cart',
  };

  constructor() {
    addIcons({ barcodeOutline });
  }

  ionViewWillEnter(): void {
    // Category→items drill: the manage page navigates here with `?filter=<id>`.
    // Applied after the route resolver's `loaded` (which resets filterBy), so
    // the filter survives the entry.
    const filter = this.#route.snapshot.queryParamMap.get('filter');
    if (filter) this.facade.selectCategory(filter);
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
