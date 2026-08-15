/* ─── why ─────────────────────────────────────────────────────────
 * The one editor whose form is genuinely not its entity. A booking stores
 * ONE signed integer; the dialog shows a magnitude and an expense/income
 * segment, and no binding turns a segment into a sign. `toForm` splits it
 * and `fromForm` puts it back — the shared base's second type parameter.
 *
 * `uniqueName` is off because a statement repeats its descriptions by the
 * dozen: the same string every week, and refusing the second one would
 * refuse the truth.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  FormField,
  min,
  SchemaPathTree,
  validate,
} from '@angular/forms/signals';
import {
  IonInput,
  IonItem,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { CategoryId } from '../../../@shared/model/category.types';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { requireParseableDate } from '../../../@shared/util/forms/form-rules';
import { CASH_TRANSACTIONS_LIST_ID } from '../../model/cash.types';
import {
  CashTransaction,
  CashTransactionStatus,
} from '../../model/transaction.types';
import { CashTransactionsFacade } from '../../data';
import { CashCategoryPickerComponent } from '../../smart-ui/cash-category-picker/cash-category-picker.component';
import { MoneyInputComponent } from '../../ui/money-input/money-input.component';
import { categoryIdOf } from '../../util/cash-category.utils';
import { createCashTransaction } from '../../util/cash.factory';

type Direction = 'expense' | 'income';

type TransactionForm = {
  name: string;
  amountCents: number | null;
  direction: Direction;
  date: string;
  pending: boolean;
  categoryId: CategoryId;
};

const MISSING_AMOUNT = { kind: 'missingAmount' } as const;

@Component({
  selector: 'app-edit-cash-transaction-dialog',
  templateUrl: './edit-cash-transaction-dialog.component.html',
  styleUrls: ['./edit-cash-transaction-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    IonItem,
    IonInput,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    TranslatePipe,
    ItemEditModalComponent,
    CashCategoryPickerComponent,
    MoneyInputComponent,
  ],
})
export class EditCashTransactionDialogComponent extends BaseEditItemDialog<
  CashTransaction,
  TransactionForm
> {
  readonly #facade = inject(CashTransactionsFacade);

  protected readonly listId: ItemListId = CASH_TRANSACTIONS_LIST_ID;
  readonly siblings = this.#facade.allItems;

  protected override uniqueName(): boolean {
    return false;
  }

  readonly amountInvalid = computed(() =>
    this.form
      .amountCents()
      .errors()
      .some(({ kind }) => kind !== MISSING_AMOUNT.kind)
  );

  protected override extraRules(path: SchemaPathTree<TransactionForm>): void {
    validate(path.amountCents, ({ value }) =>
      value() === null ? MISSING_AMOUNT : null
    );
    min(path.amountCents, 1);
    requireParseableDate(path.date);
  }

  protected blank(): CashTransaction {
    return createCashTransaction('', '');
  }

  protected override toForm(transaction: CashTransaction): TransactionForm {
    return {
      name: transaction.name,
      amountCents: transaction.amountCents
        ? Math.abs(transaction.amountCents)
        : null,
      direction: transaction.amountCents > 0 ? 'income' : 'expense',
      date: dayjs(transaction.dateISO).format('YYYY-MM-DD'),
      pending: transaction.status === 'pending',
      categoryId: categoryIdOf(transaction) ?? '',
    };
  }

  protected override fromForm(
    draft: TransactionForm,
    seed: CashTransaction
  ): CashTransaction {
    const magnitude = draft.amountCents ?? 0;
    const categoryId = draft.categoryId.trim() || undefined;
    const status: CashTransactionStatus = draft.pending
      ? 'pending'
      : 'confirmed';
    return {
      ...seed,
      name: draft.name.trim(),
      amountCents: draft.direction === 'expense' ? -magnitude : magnitude,
      dateISO: dayjs(draft.date).format(),
      status,
      categoryIds: categoryId ? [categoryId] : undefined,
      categoryManual: true,
    };
  }

  protected save(item: CashTransaction): void {
    this.#facade.saveItem(item);
  }
}
