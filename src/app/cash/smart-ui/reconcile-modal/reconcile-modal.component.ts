import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { CashTransaction } from '../../model/transaction.types';
import { CashTransactionsFacade } from '../../data';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { findReconciliationCandidates } from '../../util/reconcile.utils';

@Component({
  selector: 'app-cash-reconcile-modal',
  templateUrl: './reconcile-modal.component.html',
  styleUrls: ['./reconcile-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
})
export class CashReconcileModalComponent {
  readonly #facade = inject(CashTransactionsFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #transactions = this.#facade.allItems;

  transaction!: CashTransaction;

  readonly candidates = computed(() =>
    findReconciliationCandidates(this.transaction, this.#transactions())
  );

  reconcileWith(imported: CashTransaction): void {
    this.#facade.reconcile(this.transaction.id, imported.id);
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
