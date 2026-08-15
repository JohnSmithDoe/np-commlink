import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonIcon,
  IonNote,
  LoadingController,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  createOutline,
  swapHorizontalOutline,
  unlinkOutline,
} from 'ionicons/icons';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { CashTransaction } from '../../model/transaction.types';
import { uuidv4 } from '../../../@shared/util/app.utils';
import {
  AccountTransaction,
  CashAccountTransactionsPageFacade,
  CashRulesFacade,
  CashTransactionsFacade,
} from '../../data';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../@shared/ui/base-item/base-swipe-row';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { parserForBank } from '../../util/import/bank-parsers';
import { BankParser } from '../../util/import/bank-parser';
import { decodeCsv } from '../../util/import/read-csv';
import { ImportPlan, planImport } from '../../util/import/plan-import';
import { takePickedFile } from '../../util/picked-file.utils';
import { EditCashAccountDialogComponent } from '../edit-cash-account-dialog/edit-cash-account-dialog.component';
import { EditCashTransactionDialogComponent } from '../edit-cash-transaction-dialog/edit-cash-transaction-dialog.component';
import { CashImportPreviewModalComponent } from '../../smart-ui/import-preview-modal/import-preview-modal.component';
import { CashReconcileModalComponent } from '../../smart-ui/reconcile-modal/reconcile-modal.component';
import { presentModal } from '../../../@shared/util/app.modal.utils';

const RECONCILE: StartSwipeAction = {
  labelKey: marker('cash.a11y.reconcile'),
  icon: 'swap-horizontal-outline',
};
const DETACH: StartSwipeAction = {
  labelKey: marker('cash.a11y.detach'),
  icon: 'unlink-outline',
  color: 'medium',
};

@Component({
  selector: 'app-page-cash-account',
  templateUrl: './cash-account.page.html',
  styleUrls: ['./cash-account.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListPageComponent,
    ListItemComponent,
    EditCashAccountDialogComponent,
    EditCashTransactionDialogComponent,
    IonButtons,
    IonButton,
    IonIcon,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
  providers: [
    { provide: LIST_FACADE, useExisting: CashAccountTransactionsPageFacade },
  ],
})
export class CashAccountPage {
  readonly facade = inject(CashAccountTransactionsPageFacade);
  readonly #transactions = inject(CashTransactionsFacade);
  readonly #rulesFacade = inject(CashRulesFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #alertCtrl = inject(AlertController);
  readonly #loadingCtrl = inject(LoadingController);
  readonly #translate = inject(TranslateService);

  constructor() {
    addIcons({
      createOutline,
      cloudUploadOutline,
      swapHorizontalOutline,
      unlinkOutline,
    });
  }

  reconcileAction(txn: AccountTransaction): StartSwipeAction | undefined {
    if (txn.status === 'pending') return RECONCILE;
    return txn.reconciledManualId ? DETACH : undefined;
  }

  async reconcileOrDetach(txn: AccountTransaction): Promise<void> {
    if (txn.status === 'pending') {
      await presentModal(
        this.#modalCtrl,
        CashReconcileModalComponent,
        this.#translate.instant(marker('cash.reconcile.title')),
        { transaction: txn }
      );
      return;
    }
    if (txn.reconciledManualId) {
      this.#transactions.unreconcile(txn.reconciledManualId);
    }
  }

  async importCsv(event: Event): Promise<void> {
    const file = takePickedFile(event);
    const parser = parserForBank(this.facade.account()?.bank);
    if (!file || !parser) return;
    const plan = await this.#whileLoading(() =>
      this.#planImportFor(file, parser)
    );
    await this.#presentImportPreview(plan);
  }

  async #whileLoading<T>(work: () => Promise<T>): Promise<T> {
    const spinner = await this.#loadingCtrl.create({
      message: this.#translate.instant(marker('cash.import.loading')),
    });
    await spinner.present();
    try {
      return await work();
    } finally {
      await spinner.dismiss();
    }
  }

  async #planImportFor(file: File, parser: BankParser): Promise<ImportPlan> {
    const parsed = parser.parse(decodeCsv(await file.arrayBuffer()));
    return planImport(
      parsed,
      this.facade.accountId(),
      this.#rulesFacade.allItems(),
      this.#transactions.allItems(),
      uuidv4(),
      uuidv4
    );
  }

  async #presentImportPreview(plan: ImportPlan): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashImportPreviewModalComponent,
      this.#translate.instant(marker('cash.import.title')),
      {
        transactions: plan.toImport,
        duplicates: plan.duplicates,
        rejected: plan.rejected,
      }
    );
  }

  async confirmDelete(txn: CashTransaction): Promise<void> {
    const alert = await this.#alertCtrl.create(
      deleteConfirmAlert(this.#translate, {
        headerKey: marker('cash.txn.delete.header'),
        messageKey: marker('cash.txn.delete.message'),
        messageParams: { description: txn.name },
        onConfirm: () => this.#transactions.removeItem(txn),
      })
    );
    await alert.present();
  }
}
