import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IGlobalItem, IonViewWillEnter } from '../../../@shared/types';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GroceryListPageComponent } from '../../../@shared/feature/grocery-list-page/grocery-list-page.component';
import { ListItemComponent } from '../../../@shared/ui/item-list-items/list-item/list-item.component';
import { GlobalsActions } from '../../data/globals.actions';
import { EditGlobalItemDialogComponent } from '../../smart-ui/edit-global-item-dialog/edit-global-item-dialog.component';

@Component({
  // selector kept as `app-page-database` for cosmetic continuity (kitchen-bot).
  selector: 'app-page-database',
  templateUrl: 'globals.page.html',
  styleUrls: ['globals.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    GroceryListPageComponent,
    ListItemComponent,
    EditGlobalItemDialogComponent,
  ],
})
export class GlobalsPage implements IonViewWillEnter {
  readonly #store = inject(Store);

  ionViewWillEnter(): void {
    this.#store.dispatch(GlobalsActions.enterPage());
  }

  removeItem(item: IGlobalItem) {
    this.#store.dispatch(GlobalsActions.removeItem(item));
  }

  showEditDialog(item: IGlobalItem) {
    this.#store.dispatch(ItemDialogsActions.showEditDialog(item, '_globals'));
  }
}
