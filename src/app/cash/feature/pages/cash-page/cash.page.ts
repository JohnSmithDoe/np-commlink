import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
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
  trashOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';
import {
  ACCOUNT_KIND_LABEL_KEYS,
  ICashAccount,
  TAccountKind,
} from '../../../model/account.types';
import { PageHeaderComponent } from '../../../../@shared/ui/page-header/page-header.component';
import { CashFacade } from '../../../data';
import { deleteConfirmAlert } from '../../../util/delete-alert.utils';
import { MoneyEurPipe } from '../../../util/formatting/money.pipe';
import { CashAccountEditModalComponent } from '../../modals/account-edit-modal/account-edit-modal.component';
import { CashTransferModalComponent } from '../../modals/transfer-modal/transfer-modal.component';
import { presentModal } from '../../../../@shared/util/app.modal.utils';

const KIND_ICON: Record<TAccountKind, string> = {
  giro: 'wallet-outline',
  creditcard: 'card-outline',
  savings: 'trending-up-outline',
  cash: 'cash-outline',
};

/**
 * CREDSTICK — the cash ledger landing (accounts overview). Net-worth header +
 * one row per account (kind icon, name, running balance). Tap a row to edit,
 * swipe to delete (confirmed — the delete cascades the account's transactions).
 * Purpose-built domain: does NOT ride the grocery list engine.
 */
@Component({
  selector: 'app-page-cash',
  templateUrl: './cash.page.html',
  styleUrls: ['./cash.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonButton,
    IonButtons,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonIcon,
    IonNote,
    TranslatePipe,
    PageHeaderComponent,
    MoneyEurPipe,
  ],
})
export class CashPage {
  readonly #facade = inject(CashFacade);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly accounts = this.#facade.accountsWithBalances;
  readonly netWorthCents = this.#facade.netWorthCents;
  readonly kindLabelKeys = ACCOUNT_KIND_LABEL_KEYS;
  // A transfer needs a source and a target.
  readonly canTransfer = computed(() => this.accounts().length >= 2);

  constructor() {
    addIcons({
      walletOutline,
      cardOutline,
      trendingUpOutline,
      cashOutline,
      trashOutline,
      funnelOutline,
      swapHorizontalOutline,
      barChartOutline,
      pricetagsOutline,
    });
  }

  iconFor(kind: TAccountKind): string {
    return KIND_ICON[kind];
  }

  goToRules(): void {
    void this.#router.navigate(['/cash/rules']);
  }

  goToCategories(): void {
    void this.#router.navigate(['/cash/categories']);
  }

  goToReport(): void {
    void this.#router.navigate(['/cash/report']);
  }

  async openTransfer(): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashTransferModalComponent,
      this.#translate.instant(marker('cash.transfer.title'))
    );
  }

  async openNew(): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashAccountEditModalComponent,
      this.#translate.instant(marker('cash.account-dialog.title-new'))
    );
  }

  goToAccount(account: ICashAccount): void {
    void this.#router.navigate(['/cash', account.id]);
  }

  async confirmDelete(account: ICashAccount): Promise<void> {
    const alert = await this.#alertCtrl.create(
      deleteConfirmAlert(this.#translate, {
        headerKey: marker('cash.account.delete.header'),
        messageKey: marker('cash.account.delete.message'),
        messageParams: { name: account.name },
        onConfirm: () => this.#facade.removeAccount(account.id),
      })
    );
    await alert.present();
  }
}
