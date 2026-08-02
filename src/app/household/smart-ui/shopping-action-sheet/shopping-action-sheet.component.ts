import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActionSheetButton, IonActionSheet } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ShoppingFacade } from '../../data';

@Component({
  selector: 'app-shopping-action-sheet',
  templateUrl: './shopping-action-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonActionSheet, TranslatePipe],
})
export class ShoppingActionSheetComponent {
  readonly #shopping = inject(ShoppingFacade);
  readonly #translate = inject(TranslateService);
  readonly state = this.#shopping.state;
  readonly #hasBoughtItems = this.#shopping.hasBoughtItems;

  readonly actionSheetButtons = computed<ActionSheetButton[]>(() => {
    const moveToStorage: ActionSheetButton = {
      text: this.#translate.instant(
        marker('household.shopping.action-sheet.move-to-storage')
      ),
      role: 'destructive',
      data: { action: 'move' },
    };
    const share: ActionSheetButton = {
      text: this.#translate.instant(
        marker('household.shopping.action-sheet.share')
      ),
      data: { action: 'share' },
    };
    const cancel: ActionSheetButton = {
      text: this.#translate.instant(
        marker('household.shopping.action-sheet.cancel')
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
      this.#shopping.shareList();
    } else if (event.detail.data?.action === 'move') {
      this.#shopping.moveToStorage();
    }
    this.#shopping.hideActionSheet();
  }
}
