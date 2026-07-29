import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { IonActionSheet, ActionSheetButton } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { GroceryListPageFacade } from '../../data';

@Component({
  selector: 'app-shopping-action-sheet',
  templateUrl: './shopping-action-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonActionSheet, TranslatePipe],
})
export class ShoppingActionSheetComponent {
  readonly #facade = inject(GroceryListPageFacade);
  readonly translate = inject(TranslateService);
  readonly rxState = this.#facade.shoppingState;
  readonly #hasBoughtItems = this.#facade.shoppingHasBoughtItems;

  readonly actionSheetButtons = computed<ActionSheetButton[]>(() => {
    const moveToStorage: ActionSheetButton = {
      text: this.translate.instant(
        marker('grocery.shopping.action-sheet.move-to-storage')
      ),
      role: 'destructive',
      data: { action: 'move' },
    };
    const share: ActionSheetButton = {
      text: this.translate.instant(
        marker('grocery.shopping.action-sheet.share')
      ),
      data: { action: 'share' },
    };
    const cancel: ActionSheetButton = {
      text: this.translate.instant(
        marker('grocery.shopping.action-sheet.cancel')
      ),
      role: 'cancel',
      data: { action: 'cancel' },
    };
    return this.#hasBoughtItems()
      ? [moveToStorage, share, cancel]
      : [share, cancel];
  });

  triggerAction(
    event: CustomEvent<{ data?: { action: string }; role?: string }>
  ) {
    if (event.detail.data?.action === 'share') {
      this.#facade.shareShoppingList();
    } else if (event.detail.data?.action === 'move') {
      this.#facade.moveShoppingToStorage();
    }
    this.#facade.hideShoppingActionSheet();
  }
}
