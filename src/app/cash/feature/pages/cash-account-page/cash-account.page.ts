import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  addOutline,
  cloudUploadOutline,
  createOutline,
  swapHorizontalOutline,
  trashOutline,
  unlinkOutline,
} from 'ionicons/icons';
import { LocalizedDatePipe } from '../../../util/formatting/localized-date.pipe';
import { ICashTransaction } from '../../../model/transaction.types';
import { uuidv4 } from '../../../../@shared/util/app.utils';
import { CashFacade, TAccountTxn } from '../../../data';
import { CashDetailHeaderComponent } from '../../../ui/cash-detail-header/cash-detail-header.component';
import { deleteConfirmAlert } from '../../../util/delete-alert.utils';
import { MoneyEurPipe } from '../../../util/formatting/money.pipe';
import { parserForBank } from '../../../util/import/bank-parsers';
import { IBankParser } from '../../../util/import/bank-parser';
import { decodeCsv } from '../../../util/import/read-csv';
import { IImportPlan, planImport } from '../../../util/import/plan-import';
import { takePickedFile } from '../../../util/picked-file.utils';
import { CashAccountEditModalComponent } from '../../modals/account-edit-modal/account-edit-modal.component';
import { CashTransactionEditModalComponent } from '../../modals/transaction-edit-modal/transaction-edit-modal.component';
import { CashImportPreviewModalComponent } from '../../../smart-ui/import-preview-modal/import-preview-modal.component';
import { CashReconcileModalComponent } from '../../../smart-ui/reconcile-modal/reconcile-modal.component';
import { categoryNameLookup } from '../../../../@shared/util/categories/category.utils';
import { presentModal } from '../../../../@shared/util/app.modal.utils';

import { TCategoryId } from '../../../../@shared/model/category.types';

/**
 * A single account's transaction ledger. Header carries back / edit-account /
 * add-transaction; a balance strip mirrors the overview; the list is newest
 * first with signed amounts, an optional category, and a pending marker. Tap a
 * row to edit, swipe to delete. The account id is fixed for the page lifetime.
 */
@Component({
  selector: 'app-page-cash-account',
  templateUrl: './cash-account.page.html',
  styleUrls: ['./cash-account.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CashDetailHeaderComponent,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonIcon,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
})
export class CashAccountPage {
  readonly #facade = inject(CashFacade);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #modalCtrl = inject(ModalController);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly id = this.#route.snapshot.paramMap.get('accountId') ?? '';

  readonly account = this.#facade.accountById(this.id);
  readonly transactions = this.#facade.transactionsForAccount(this.id);
  readonly #balances = this.#facade.accountBalances;
  readonly #rules = this.#facade.rules;
  readonly #categories = this.#facade.categories;
  readonly #categoryName = computed(() =>
    categoryNameLookup(this.#categories())
  );
  readonly balanceCents = computed(() => this.#balances()[this.id] ?? 0);

  categoryName(id: TCategoryId | undefined): string {
    return this.#categoryName()(id);
  }
  // A CSV import is only available when the account's bank has a parser.
  readonly canImport = computed(() => !!parserForBank(this.account()?.bank));

  constructor() {
    addIcons({
      createOutline,
      addOutline,
      trashOutline,
      cloudUploadOutline,
      swapHorizontalOutline,
      unlinkOutline,
    });
  }

  async reconcile(txn: ICashTransaction): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashReconcileModalComponent,
      this.#translate.instant(marker('cash.reconcile.title')),
      { transaction: txn }
    );
  }

  /** Reverse a reconciliation from the surviving txn: detach the manual leg it
   *  absorbed and restore that leg to pending (visible + counted again). */
  detachReconcile(txn: TAccountTxn): void {
    if (!txn.reconciledManualId) return;
    this.#facade.unreconcileTransaction(txn.reconciledManualId);
  }

  goBack(): void {
    void this.#router.navigate(['/cash']);
  }

  async editAccount(): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashAccountEditModalComponent,
      this.#translate.instant(marker('cash.account-dialog.title-edit')),
      { accountId: this.id }
    );
  }

  async importCsv(event: Event): Promise<void> {
    const file = takePickedFile(event);
    const parser = parserForBank(this.account()?.bank);
    if (!file || !parser) return;
    await this.#presentImportPreview(await this.#planImportFor(file, parser));
  }

  async #planImportFor(file: File, parser: IBankParser): Promise<IImportPlan> {
    const parsed = parser.parse(decodeCsv(await file.arrayBuffer()));
    return planImport(
      parsed,
      this.id,
      this.#rules(),
      this.transactions(),
      uuidv4(),
      uuidv4
    );
  }

  async #presentImportPreview(plan: IImportPlan): Promise<void> {
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

  async addTransaction(): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashTransactionEditModalComponent,
      this.#translate.instant(marker('cash.txn-dialog.title-new')),
      { accountId: this.id }
    );
  }

  async editTransaction(txn: ICashTransaction): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashTransactionEditModalComponent,
      this.#translate.instant(marker('cash.txn-dialog.title-edit')),
      { accountId: this.id, transactionId: txn.id }
    );
  }

  async confirmDelete(txn: ICashTransaction): Promise<void> {
    const alert = await this.#alertCtrl.create(
      deleteConfirmAlert(this.#translate, {
        headerKey: marker('cash.txn.delete.header'),
        messageKey: marker('cash.txn.delete.message'),
        messageParams: { description: txn.description },
        onConfirm: () => this.#facade.removeTransaction(txn.id),
      })
    );
    await alert.present();
  }
}
