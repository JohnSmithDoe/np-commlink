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
  CashAccountsFacade,
  CashAccountTransactionsPageFacade,
  CashRulesFacade,
  CashSchedulesFacade,
  CashTransactionsFacade,
} from '../../data';
import { ParseResult } from '../../util/import/parsed-row';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../@shared/ui/base-item/base-swipe-row';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { readStatementDocuments } from '../../util/import/read-bank-file';
import { readStatement, StatementRead } from '../../util/import/read-statement';
import { ImportPlan, planImport } from '../../util/import/plan-import';
import { lastEntryDateISO } from '../../util/import/balance-check';
import { amountChangesFor } from '../../util/schedule.utils';
import { takePickedFiles } from '../../util/picked-file.utils';
import { CashAccount } from '../../model/account.types';
import { EditCashAccountDialogComponent } from '../edit-cash-account-dialog/edit-cash-account-dialog.component';
import { EditCashRuleDialogComponent } from '../edit-cash-rule-dialog/edit-cash-rule-dialog.component';
import { EditCashScheduleDialogComponent } from '../edit-cash-schedule-dialog/edit-cash-schedule-dialog.component';
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
    EditCashRuleDialogComponent,
    EditCashScheduleDialogComponent,
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
  readonly #accounts = inject(CashAccountsFacade);
  readonly #rulesFacade = inject(CashRulesFacade);
  readonly #schedulesFacade = inject(CashSchedulesFacade);
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

  async importStatement(event: Event): Promise<void> {
    const files = takePickedFiles(event);
    const account = this.facade.account();
    if (files.length === 0 || !account) return;

    const read = await this.#whileLoading(() =>
      this.#readStatement(files, account)
    );
    if (read.kind === 'unreadable') {
      this.#accounts.reportStatementUnreadable();
      return;
    }
    if (read.kind === 'wrong-account') {
      this.#accounts.reportWrongAccount(read.found);
      return;
    }
    if (read.iban && !account.iban) {
      this.#accounts.saveItem({ ...account, iban: read.iban });
    }
    await this.#presentImportPreview(read.parsed);
  }

  async #readStatement(
    files: File[],
    account: CashAccount
  ): Promise<StatementRead> {
    return readStatement(await readStatementDocuments(files), account.iban);
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

  #planFrom(parsed: ParseResult): ImportPlan {
    return planImport(
      parsed,
      this.facade.accountId(),
      this.#rulesFacade.allItems(),
      this.#transactions.allItems(),
      uuidv4(),
      uuidv4
    );
  }

  async #presentImportPreview(parsed: ParseResult): Promise<void> {
    const plan = this.#planFrom(parsed);
    await presentModal(
      this.#modalCtrl,
      CashImportPreviewModalComponent,
      this.#translate.instant(marker('cash.import.title')),
      {
        transactions: plan.toImport,
        duplicates: plan.duplicates,
        rejected: plan.rejected,
        accountId: this.facade.accountId(),
        closingBalanceCents: parsed.closingBalanceCents,
        asOfISO: lastEntryDateISO(parsed.rows),
        amountChanges: amountChangesFor(
          plan.toImport,
          this.#schedulesFacade.allItems()
        ),
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
