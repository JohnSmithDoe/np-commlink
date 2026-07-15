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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cardOutline,
  cashOutline,
  funnelOutline,
  swapHorizontalOutline,
  trashOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';
import { ICashAccount, TAccountKind } from '../../../@shared/types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { CashActions } from '../../data/cash.actions';
import {
  selectAccountsWithBalances,
  selectNetWorthCents,
} from '../../data/cash.selector';
import { MoneyEurPipe } from '../../util/money.pipe';
import { CashAccountEditModalComponent } from '../../smart-ui/account-edit-modal/account-edit-modal.component';
import { CashTransferModalComponent } from '../../smart-ui/transfer-modal/transfer-modal.component';

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
    TranslateModule,
    PageHeaderComponent,
    MoneyEurPipe,
  ],
})
export class CashPage {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly accounts = this.#store.selectSignal(selectAccountsWithBalances);
  readonly netWorthCents = this.#store.selectSignal(selectNetWorthCents);
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
    });
  }

  iconFor(kind: TAccountKind): string {
    return KIND_ICON[kind];
  }

  goToRules(): void {
    void this.#router.navigate(['/cash/rules']);
  }

  goToReport(): void {
    void this.#router.navigate(['/cash/report']);
  }

  async openTransfer(): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: CashTransferModalComponent,
    });
    await modal.present();
  }

  async openNew(): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: CashAccountEditModalComponent,
    });
    await modal.present();
  }

  goToAccount(account: ICashAccount): void {
    void this.#router.navigate(['/cash', account.id]);
  }

  async confirmDelete(account: ICashAccount): Promise<void> {
    const alert = await this.#alertCtrl.create({
      header: this.#translate.instant(marker('cash.account.delete.header')),
      message: this.#translate.instant(marker('cash.account.delete.message'), {
        name: account.name,
      }),
      buttons: [
        {
          text: this.#translate.instant(marker('cash.action.cancel')),
          role: 'cancel',
        },
        {
          text: this.#translate.instant(marker('cash.action.delete')),
          role: 'destructive',
          handler: () =>
            this.#store.dispatch(CashActions.removeAccount(account.id)),
        },
      ],
    });
    await alert.present();
  }
}
