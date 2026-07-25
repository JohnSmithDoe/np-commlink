import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { ICategory, TCategoryId } from '../../../@shared/model/types';
import { ICashTransaction, TCashTxnStatus } from '../../model';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { CashCategoryPickerComponent } from '../../ui/cash-category-picker/cash-category-picker.component';
import { CashFacade } from '../../data';
import { centsToInput, eurToCents } from '../../util/money';

type TDirection = 'expense' | 'income';

/**
 * Create/edit a MANUAL transaction, presented via `ModalController`. `accountId`
 * (create) and `transactionId` (edit) are imperative componentProps. Amount is
 * entered as a positive magnitude plus a direction segment; the signed
 * `amountCents` (< 0 = expense) is composed on save. A human-set category is
 * flagged `categoryManual` so P3 rule re-runs leave it alone.
 */
@Component({
  selector: 'app-cash-transaction-edit-modal',
  templateUrl: './transaction-edit-modal.component.html',
  styleUrls: ['./transaction-edit-modal.component.scss'],
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
    IonInput,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    TranslateModule,
    CashCategoryPickerComponent,
  ],
})
export class CashTransactionEditModalComponent implements OnInit {
  readonly #facade = inject(CashFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #transactions = this.#facade.transactions;
  readonly categories = this.#facade.categories;

  /** Create mode: the account the new txn belongs to. */
  accountId!: string;
  /** Edit mode: the txn being edited (undefined = create). */
  transactionId?: string;

  readonly description = signal('');
  readonly amount = signal('');
  readonly direction = signal<TDirection>('expense');
  readonly date = signal(dayjs().format('YYYY-MM-DD'));
  readonly pending = signal(false);
  // The selected category id ('' = none).
  readonly categoryId = signal<TCategoryId>('');

  readonly isEdit = computed(() => !!this.transactionId);
  readonly #magnitudeCents = computed(() => eurToCents(this.amount()));
  readonly amountInvalid = computed(() => {
    const cents = this.#magnitudeCents();
    return this.amount().trim() !== '' && (cents === null || cents <= 0);
  });
  readonly canSave = computed(() => {
    const cents = this.#magnitudeCents();
    return this.description().trim().length > 0 && cents !== null && cents > 0;
  });

  ngOnInit(): void {
    const existing = this.#existing();
    if (!existing) return;
    this.description.set(existing.description);
    this.direction.set(existing.amountCents < 0 ? 'expense' : 'income');
    this.amount.set(centsToInput(Math.abs(existing.amountCents)));
    this.date.set(dayjs(existing.dateISO).format('YYYY-MM-DD'));
    this.pending.set(existing.status === 'pending');
    this.categoryId.set(existing.categoryId ?? '');
  }

  onDescription(value: string): void {
    this.description.set(value);
  }

  onAmount(value: string): void {
    this.amount.set(value);
  }

  onDirection(value: TDirection): void {
    this.direction.set(value);
  }

  onDate(value: string): void {
    this.date.set(value);
  }

  // Category CRUD forwarded to the facade; the picker owns selection state.
  onAddCategory(category: ICategory): void {
    this.#facade.addCategory(category);
  }

  onDeleteCategory(id: TCategoryId): void {
    this.#facade.removeCategory(id);
  }

  onRenameCategory({ id, to }: { id: TCategoryId; to: string }): void {
    this.#facade.updateCategory(id, to);
  }

  onPending(value: boolean): void {
    this.pending.set(value);
  }

  save(): void {
    if (!this.canSave()) return;
    const magnitude = this.#magnitudeCents() ?? 0;
    const amountCents = this.direction() === 'expense' ? -magnitude : magnitude;
    const categoryId = this.categoryId().trim() || undefined;
    const status: TCashTxnStatus = this.pending() ? 'pending' : 'confirmed';
    const patch = {
      dateISO: dayjs(this.date()).format(),
      amountCents,
      description: this.description().trim(),
      status,
      categoryId,
      // A human editing the txn owns the category (shielded from P3 rules).
      categoryManual: categoryId ? true : undefined,
    };
    const existing = this.#existing();
    if (existing) {
      this.#facade.updateTransaction({ ...existing, ...patch });
    } else {
      const transaction: ICashTransaction = {
        id: uuidv4(),
        accountId: this.accountId,
        source: 'manual',
        ...patch,
      };
      this.#facade.addTransaction(transaction);
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }

  #existing(): ICashTransaction | undefined {
    return this.transactionId
      ? this.#transactions().find((t) => t.id === this.transactionId)
      : undefined;
  }
}
