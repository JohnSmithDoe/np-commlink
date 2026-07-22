import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { IonActionSheet, ActionSheetButton } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IAppState } from '../../../@shared/types';
import {
  ShoppingActions,
  selectShoppingListHasBoughtItems,
  selectShoppingState,
} from '../../data';

@Component({
  selector: 'app-shopping-action-sheet',
  templateUrl: './shopping-action-sheet.component.html',
  styleUrls: ['./shopping-action-sheet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonActionSheet, TranslateModule],
})
export class ShoppingActionSheetComponent {
  readonly #store = inject(Store<IAppState>);
  readonly translate = inject(TranslateService);
  readonly rxState = this.#store.selectSignal(selectShoppingState);
  readonly #hasBoughtItems = this.#store.selectSignal(
    selectShoppingListHasBoughtItems
  );

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
      this.#store.dispatch(ShoppingActions.shareShoppinglist());
    } else if (event.detail.data?.action === 'move') {
      this.#store.dispatch(ShoppingActions.moveToStorage());
    }
    this.#store.dispatch(ShoppingActions.hideActionSheet());
  }
}
