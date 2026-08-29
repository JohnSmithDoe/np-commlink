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
import {
  AccountTransaction,
  CashAccountsFacade,
  CashAccountTransactionsPageFacade,
  CashImportFacade,
  CashTransactionsFacade,
} from '../../data';
import { ParseResult } from '../../util/import/parsed-row';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../@shared/ui/base-item/base-swipe-row';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { Category } from '../../../@shared/model/category.types';
import { categoryNames } from '../../../@shared/util/categories/category.utils';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { readStatementDocuments } from '../../util/import/read-bank-file';
import { readStatement, StatementRead } from '../../util/import/read-statement';
import { takePickedFiles } from '../../../@shared/util/forms/picked-file.utils';
import { CashAccount } from '../../model/account.types';
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
  readonly #import = inject(CashImportFacade);
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

  categoryOf(txn: AccountTransaction, catalog: readonly Category[]): string {
    return categoryNames(txn, catalog).join(', ');
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
    if (read.iban) this.#import.adoptIban(account.id, read.iban);
    await this.#presentImportPreview(read.parsed);
  }

  async #readStatement(
    files: File[],
    account: CashAccount
  ): Promise<StatementRead> {
    try {
      return readStatement(await readStatementDocuments(files), account.iban);
    } catch {
      return { kind: 'unreadable' };
    }
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

  async #presentImportPreview(parsed: ParseResult): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashImportPreviewModalComponent,
      this.#translate.instant(marker('cash.import.title')),
      { preview: this.#import.plan(parsed, this.facade.accountId()) }
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
