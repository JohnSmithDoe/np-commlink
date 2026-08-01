import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  FormField,
  min,
  SchemaFn,
  SchemaPathTree,
  validate,
} from '@angular/forms/signals';
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
import { TranslatePipe } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { uuidv4 } from '../../../../@shared/util/app.utils';
import { BaseModalDialog } from '../../../../@shared/feature/modal-dialog/base-modal-dialog';
import {
  requireParseableDate,
  requireText,
} from '../../../../@shared/util/forms/form-rules';
import {
  ICashTransaction,
  TCashTxnStatus,
} from '../../../model/transaction.types';
import { CashCategoryPickerComponent } from '../../../ui/cash-category-picker/cash-category-picker.component';
import { CashFacade } from '../../../data';
import { MoneyInputComponent } from '../../../ui/money-input/money-input.component';
import {
  ICategory,
  TCategoryId,
} from '../../../../@shared/model/category.types';

type TDirection = 'expense' | 'income';

// The signed `amountCents` is edited as a positive magnitude + a direction
// segment, so the form is a view-model over ICashTransaction, not a copy.
type TTransactionForm = {
  description: string;
  amountCents: number | null;
  direction: TDirection;
  date: string;
  pending: boolean;
  // '' = no category.
  categoryId: TCategoryId;
};

const MISSING_AMOUNT = { kind: 'missingAmount' } as const;

// The amount names its empty case itself, which is what lets the note below
// exclude it: an *empty* amount earns no error note, anything unusable in the box
// does. `min` is usable because `app-money-input` hands over cents — and it
// reports the unparseable case by itself.
const transactionRules: SchemaFn<TTransactionForm> = (path) => {
  requireText(path.description);
  validate(path.amountCents, ({ value }) =>
    value() === null ? MISSING_AMOUNT : null
  );
  min(path.amountCents, 1);
  requireParseableDate(path.date);
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
    FormField,
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
    TranslatePipe,
    CashCategoryPickerComponent,
    MoneyInputComponent,
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

  protected applyRules(path: SchemaPathTree<TTransactionForm>): void {
    transactionRules(path);
  }

  // Every error kind except "empty" earns the note — an unusable box says so,
  // an untouched one just leaves the save disabled.
  readonly amountInvalid = computed(() =>
    this.form
      .amountCents()
      .errors()
      .some(({ kind }) => kind !== MISSING_AMOUNT.kind)
  );
  readonly dateInvalid = computed(() => this.form.date().invalid());

  protected blank(): TTransactionForm {
    return {
      description: '',
      amountCents: null,
      direction: 'expense',
      date: dayjs().format('YYYY-MM-DD'),
      pending: false,
      categoryId: '',
    };
  }

  protected toForm(transaction: ICashTransaction): TTransactionForm {
    return {
      description: transaction.description,
      amountCents: Math.abs(transaction.amountCents),
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
    const magnitude = draft.amountCents ?? 0;
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
