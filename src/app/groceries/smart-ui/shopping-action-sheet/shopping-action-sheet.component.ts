import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActionSheetButton } from '@ionic/angular';
import { IonActionSheet } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { IAppState } from '../../../@shared/types';
import {
  ShoppingActions,
  selectShoppingListHasBoughtItems,
  selectShoppingState,
} from '../../data';

const moveToShoppingListButton: ActionSheetButton = {
  text: 'In die Vorräte übernehmen',
  role: 'destructive',
  data: {
    action: 'move',
  },
};

const shareButton: ActionSheetButton = {
  text: 'Share',
  data: {
    action: 'share',
  },
};

const cancelButton: ActionSheetButton = {
  text: 'Abbrechen',
  role: 'cancel',
  data: {
    action: 'cancel',
  },
};

@Component({
  selector: 'app-shopping-action-sheet',
  templateUrl: './shopping-action-sheet.component.html',
  styleUrls: ['./shopping-action-sheet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonActionSheet],
})
export class ShoppingActionSheetComponent {
  readonly #store = inject(Store<IAppState>);
  readonly translate = inject(TranslateService);
  readonly rxState = this.#store.selectSignal(selectShoppingState);
  readonly #hasBoughtItems = this.#store.selectSignal(
    selectShoppingListHasBoughtItems
  );

  readonly actionSheetButtons = computed<ActionSheetButton[]>(() =>
    this.#hasBoughtItems()
      ? [moveToShoppingListButton, shareButton, cancelButton]
      : [shareButton, cancelButton]
  );

  triggerAction(ev: CustomEvent<{ data?: { action: string }; role?: string }>) {
    if (ev.detail.data?.action === 'share') {
      this.#store.dispatch(ShoppingActions.shareShoppinglist());
    } else if (ev.detail.data?.action === 'move') {
      this.#store.dispatch(ShoppingActions.moveToStorage());
    }
    this.#store.dispatch(ShoppingActions.hideActionSheet());
  }
}
