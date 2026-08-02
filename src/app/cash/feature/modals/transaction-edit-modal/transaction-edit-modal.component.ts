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
  CashTransaction,
  CashTransactionStatus,
} from '../../../model/transaction.types';
import { CashCategoryPickerComponent } from '../../../ui/cash-category-picker/cash-category-picker.component';
import { CashFacade } from '../../../data';
import { MoneyInputComponent } from '../../../ui/money-input/money-input.component';
import { Category, CategoryId } from '../../../../@shared/model/category.types';

type Direction = 'expense' | 'income';

type TransactionForm = {
  description: string;
  amountCents: number | null;
  direction: Direction;
  date: string;
  pending: boolean;
  categoryId: CategoryId;
};

const MISSING_AMOUNT = { kind: 'missingAmount' } as const;

const transactionRules: SchemaFn<TransactionForm> = (path) => {
  requireText(path.description);
  validate(path.amountCents, ({ value }) =>
    value() === null ? MISSING_AMOUNT : null
  );
  min(path.amountCents, 1);
  requireParseableDate(path.date);
};

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
  CashTransaction,
  TransactionForm
> {
  readonly #facade = inject(CashFacade);
  readonly #transactions = this.#facade.transactions;
  readonly categories = this.#facade.categories;

  accountId!: string;
  set transactionId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<CashTransaction | undefined>(() => {
    const id = this.editId();
    return id
      ? this.#transactions().find((transaction) => transaction.id === id)
      : undefined;
  });

  protected applyRules(path: SchemaPathTree<TransactionForm>): void {
    transactionRules(path);
  }

  readonly amountInvalid = computed(() =>
    this.form
      .amountCents()
      .errors()
      .some(({ kind }) => kind !== MISSING_AMOUNT.kind)
  );
  readonly dateInvalid = computed(() => this.form.date().invalid());

  protected blank(): TransactionForm {
    return {
      description: '',
      amountCents: null,
      direction: 'expense',
      date: dayjs().format('YYYY-MM-DD'),
      pending: false,
      categoryId: '',
    };
  }

  protected toForm(transaction: CashTransaction): TransactionForm {
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
    draft: TransactionForm,
    existing: CashTransaction | undefined
  ): void {
    const magnitude = draft.amountCents ?? 0;
    const categoryId = draft.categoryId.trim() || undefined;
    const status: CashTransactionStatus = draft.pending
      ? 'pending'
      : 'confirmed';
    const fields = {
      dateISO: dayjs(draft.date).format(),
      amountCents: draft.direction === 'expense' ? -magnitude : magnitude,
      description: draft.description.trim(),
      status,
      categoryId,
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

  onAddCategory(category: Category): void {
    this.#facade.addCategory(category);
  }

  onDeleteCategory(id: CategoryId): void {
    this.#facade.removeCategory(id);
  }

  onRenameCategory({ id, to }: { id: CategoryId; to: string }): void {
    this.#facade.updateCategory(id, to);
  }
}
