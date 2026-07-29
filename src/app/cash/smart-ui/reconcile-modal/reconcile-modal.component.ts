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
import { localizedDate } from '../../../@shared/util/date-format.utils';
import { ICashTransaction } from '../../model/transaction.types';
import { CashFacade } from '../../data';
import { MoneyEurPipe } from '../../util/money.pipe';
import { findReconciliationCandidates } from '../../util/reconcile.utils';

/**
 * Pick the imported transaction a `pending` manual entry should merge into (via
 * `ModalController`). The pending `transaction` is an imperative componentProp;
 * candidates come from the pure `findReconciliationCandidates` heuristic. Tapping
 * one dispatches `Reconcile Transaction` and dismisses. We never auto-pick.
 */
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
  ],
})
export class CashReconcileModalComponent {
  readonly #facade = inject(CashFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #transactions = this.#facade.transactions;

  /** The pending manual entry to reconcile (imperative componentProp). */
  transaction!: ICashTransaction;

  readonly candidates = computed(() =>
    findReconciliationCandidates(this.transaction, this.#transactions())
  );

  formatDate(iso: string): string {
    return localizedDate(iso);
  }

  reconcileWith(imported: ICashTransaction): void {
    this.#facade.reconcileTransaction(this.transaction.id, imported.id);
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
