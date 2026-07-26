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
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import {
  ICashTransaction,
  TCashTxnStatus,
} from '../../model/transaction.types';
import { CashCategoryPickerComponent } from '../../ui/cash-category-picker/cash-category-picker.component';
import { CashFacade } from '../../data';
import { centsToInput, eurToCents } from '../../util/money.utils';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

type TDirection = 'expense' | 'income';

// The signed `amountCents` is edited as a positive magnitude string + a direction
// segment, so the form is a view-model over ICashTransaction, not a copy.
type TTransactionForm = {
  description: string;
  amount: string;
  direction: TDirection;
  date: string;
  pending: boolean;
  // '' = no category.
  categoryId: TCategoryId;
};

/**
 * Create/edit a MANUAL transaction, presented via `ModalController`. Amount is
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
export class CashTransactionEditModalComponent extends BaseModalDialog<
  ICashTransaction,
  TTransactionForm
> {
  readonly #facade = inject(CashFacade);
  readonly #transactions = this.#facade.transactions;
  readonly categories = this.#facade.categories;

  /** Create mode: the account the new txn belongs to. */
  accountId!: string;
  /** Edit mode: set imperatively via `componentProps` (undefined = create). */
  set transactionId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<ICashTransaction | undefined>(() => {
    const id = this.editId();
    return id
      ? this.#transactions().find((transaction) => transaction.id === id)
      : undefined;
  });

  readonly #magnitudeCents = computed(() => eurToCents(this.draft().amount));
  readonly amountInvalid = computed(() => {
    const cents = this.#magnitudeCents();
    return this.draft().amount.trim() !== '' && (cents === null || cents <= 0);
  });
  // The date input is clearable, and `dayjs('').format()` is the *string*
  // 'Invalid Date' — which persists, sorts above every real date, buckets into
  // a phantom month in the report and can never be reconciled.
  readonly dateInvalid = computed(() => !dayjs(this.draft().date).isValid());
  readonly canSave = computed(() => {
    const cents = this.#magnitudeCents();
    return (
      this.draft().description.trim().length > 0 &&
      cents !== null &&
      cents > 0 &&
      !this.dateInvalid()
    );
  });

  protected blank(): TTransactionForm {
    return {
      description: '',
      amount: '',
      direction: 'expense',
      date: dayjs().format('YYYY-MM-DD'),
      pending: false,
      categoryId: '',
    };
  }

  protected toForm(transaction: ICashTransaction): TTransactionForm {
    return {
      description: transaction.description,
      amount: centsToInput(Math.abs(transaction.amountCents)),
      direction: transaction.amountCents < 0 ? 'expense' : 'income',
      date: dayjs(transaction.dateISO).format('YYYY-MM-DD'),
      pending: transaction.status === 'pending',
      categoryId: transaction.categoryId ?? '',
    };
  }

  protected persist(
    draft: TTransactionForm,
    existing: ICashTransaction | undefined
  ): void {
    const magnitude = this.#magnitudeCents() ?? 0;
    const categoryId = draft.categoryId.trim() || undefined;
    const status: TCashTxnStatus = draft.pending ? 'pending' : 'confirmed';
    const fields = {
      dateISO: dayjs(draft.date).format(),
      amountCents: draft.direction === 'expense' ? -magnitude : magnitude,
      description: draft.description.trim(),
      status,
      categoryId,
      // A human editing the txn owns the category — including clearing it —
      // so it's shielded from P3 rules either way.
      categoryManual: true,
    };
    if (existing) {
      this.#facade.updateTransaction({ ...existing, ...fields });
    } else {
      this.#facade.addTransaction({
        id: uuidv4(),
        accountId: this.accountId,
        source: 'manual',
        ...fields,
      });
    }
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
}
