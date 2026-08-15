import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonIcon,
  IonNote,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cardOutline,
  cashOutline,
  funnelOutline,
  pricetagsOutline,
  swapHorizontalOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';
import {
  ACCOUNT_KIND_LABEL_KEYS,
  AccountKind,
  CashAccount,
} from '../../model/account.types';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import {
  AccountWithBalance,
  CashAccountsFacade,
  CashAccountsPageFacade,
} from '../../data';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { EditCashAccountDialogComponent } from '../edit-cash-account-dialog/edit-cash-account-dialog.component';
import { CashTransferModalComponent } from '../transfer-modal/transfer-modal.component';
import { presentModal } from '../../../@shared/util/app.modal.utils';

const KIND_ICON: Record<AccountKind, string> = {
  giro: 'wallet-outline',
  creditcard: 'card-outline',
  savings: 'trending-up-outline',
  cash: 'cash-outline',
};

@Component({
  selector: 'app-page-cash',
  templateUrl: './cash.page.html',
  styleUrls: ['./cash.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListPageComponent,
    ListItemComponent,
    EditCashAccountDialogComponent,
    IonButton,
    IonButtons,
    IonIcon,
    IonNote,
    RouterLink,
    TranslatePipe,
    MoneyEurPipe,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: CashAccountsPageFacade }],
})
export class CashPage {
  readonly facade = inject(CashAccountsPageFacade);
  readonly #accounts = inject(CashAccountsFacade);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly netWorthCents = this.#accounts.netWorthCents;
  readonly canTransfer = computed(() => this.#accounts.allItems().length >= 2);

  constructor() {
    addIcons({
      walletOutline,
      cardOutline,
      trendingUpOutline,
      cashOutline,
      funnelOutline,
      swapHorizontalOutline,
      barChartOutline,
      pricetagsOutline,
    });
  }

  iconFor(account: CashAccount): string {
    return KIND_ICON[account.kind];
  }

  kindLabel(account: CashAccount): string {
    return ACCOUNT_KIND_LABEL_KEYS[account.kind];
  }

  async openTransfer(): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashTransferModalComponent,
      this.#translate.instant(marker('cash.transfer.title'))
    );
  }

  goToAccount(account: AccountWithBalance | CashAccount): void {
    void this.#router.navigate(['/cash', account.id]);
  }

  async confirmDelete(account: CashAccount): Promise<void> {
    const alert = await this.#alertCtrl.create(
      deleteConfirmAlert(this.#translate, {
        headerKey: marker('cash.account.delete.header'),
        messageKey: marker('cash.account.delete.message'),
        messageParams: { name: account.name },
        onConfirm: () => this.#accounts.removeItem(account),
      })
    );
    await alert.present();
  }
}
