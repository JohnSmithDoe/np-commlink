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
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  cloudUploadOutline,
  createOutline,
  swapHorizontalOutline,
  trashOutline,
  unlinkOutline,
} from 'ionicons/icons';
import { TCategoryId } from '../../../@shared/model/types';
import { ICashTransaction } from '../../model';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { CashFacade, TAccountTxn } from '../../data';
import { deleteConfirmAlert } from '../../util/delete-alert';
import { MoneyEurPipe } from '../../util/money.pipe';
import { parserForBank } from '../../util/import/bank-parsers';
import { decodeCsv } from '../../util/import/read-csv';
import { planImport } from '../../util/import/plan-import';
import { CashAccountEditModalComponent } from '../../smart-ui/account-edit-modal/account-edit-modal.component';
import { CashTransactionEditModalComponent } from '../../smart-ui/transaction-edit-modal/transaction-edit-modal.component';
import { CashImportPreviewModalComponent } from '../../smart-ui/import-preview-modal/import-preview-modal.component';
import { CashReconcileModalComponent } from '../../smart-ui/reconcile-modal/reconcile-modal.component';

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
    IonHeader,
    IonToolbar,
    IonTitle,
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
    TranslateModule,
    MoneyEurPipe,
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
  readonly #categoryNameById = computed(
    () => new Map(this.#categories().map((c) => [c.id, c.name]))
  );
  readonly balanceCents = computed(() => this.#balances()[this.id] ?? 0);

  categoryName(id: TCategoryId | undefined): string {
    return id ? (this.#categoryNameById().get(id) ?? '') : '';
  }
  // A CSV import is only available when the account's bank has a parser.
  readonly canImport = computed(() => !!parserForBank(this.account()?.bank));

  constructor() {
    addIcons({
      arrowBackOutline,
      createOutline,
      addOutline,
      trashOutline,
      cloudUploadOutline,
      swapHorizontalOutline,
      unlinkOutline,
    });
  }

  async reconcile(txn: ICashTransaction): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: CashReconcileModalComponent,
      componentProps: { transaction: txn },
    });
    await modal.present();
  }

  /** Reverse a reconciliation from the surviving txn: detach the manual leg it
   *  absorbed and restore that leg to pending (visible + counted again). */
  detachReconcile(txn: TAccountTxn): void {
    if (!txn.reconciledManualId) return;
    this.#facade.unreconcileTransaction(txn.reconciledManualId);
  }

  formatDate(iso: string): string {
    return dayjs(iso).format('DD.MM.YYYY');
  }

  goBack(): void {
    void this.#router.navigate(['/cash']);
  }

  async editAccount(): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: CashAccountEditModalComponent,
      componentProps: { accountId: this.id },
    });
    await modal.present();
  }

  async importCsv(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // let the same file be re-picked later
    const parser = parserForBank(this.account()?.bank);
    if (!file || !parser) return;

    const rows = parser.parse(decodeCsv(await file.arrayBuffer()));
    const plan = planImport(
      rows,
      this.id,
      this.#rules(),
      this.transactions(),
      uuidv4(),
      uuidv4
    );
    const modal = await this.#modalCtrl.create({
      component: CashImportPreviewModalComponent,
      componentProps: {
        transactions: plan.toImport,
        duplicates: plan.duplicates,
      },
    });
    await modal.present();
  }

  async addTransaction(): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: CashTransactionEditModalComponent,
      componentProps: { accountId: this.id },
    });
    await modal.present();
  }

  async editTransaction(txn: ICashTransaction): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: CashTransactionEditModalComponent,
      componentProps: { accountId: this.id, transactionId: txn.id },
    });
    await modal.present();
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
