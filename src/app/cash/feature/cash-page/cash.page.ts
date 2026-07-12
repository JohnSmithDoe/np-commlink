import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { addIcons } from 'ionicons';
import { arrowBackOutline, walletOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { selectCashAccounts } from '../../data/cash.selector';

/**
 * CREDSTICK — the cash ledger landing (accounts overview).
 *
 * P0 scaffold: store-connected shell only. P1 fills this with the accounts
 * list, running balances and net worth. Purpose-built domain — it does NOT
 * ride the grocery list engine.
 */
@Component({
  selector: 'app-page-cash',
  templateUrl: './cash.page.html',
  styleUrls: ['./cash.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonIcon,
    RouterLink,
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class CashPage {
  readonly #store = inject(Store);
  readonly accounts = this.#store.selectSignal(selectCashAccounts);

  constructor() {
    addIcons({ walletOutline, arrowBackOutline });
  }
}
