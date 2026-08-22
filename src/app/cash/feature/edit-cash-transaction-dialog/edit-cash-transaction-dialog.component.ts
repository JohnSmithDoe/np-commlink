/* ─── why ─────────────────────────────────────────────────────────
 * The one editor whose form is genuinely not its entity. A booking stores
 * ONE signed integer; the dialog shows a magnitude and an expense/income
 * segment, and no binding turns a segment into a sign. `toForm` splits it
 * and `fromForm` puts it back — the shared base's second type parameter.
 *
 * `uniqueName` is off because a statement repeats its descriptions by the
 * dozen: the same string every week, and refusing the second one would
 * refuse the truth.
 *
 * Deriving COMMITS the booking first, whenever the form is saveable. The
 * flow it serves is "file this one, then file the rest like it", so the
 * category on screen is the one the rule must carry — and a rule filing
 * everything except the booking it came from is the split brain the commit
 * avoids. `ItemDialogService` holds one request, so opening the derived
 * dialog closes this one on its own.
 *
 * `categoryManual` is stamped only when the category CHANGED here. It means
 * "the user chose this, do not overrule it", and setting it on every save
 * froze a booking against every future rule because somebody fixed its date.
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
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { addIcons } from 'ionicons';
import { funnelOutline, repeatOutline } from 'ionicons/icons';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { CategoryId } from '../../../@shared/model/category.types';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { CashBankDetailsComponent } from '../../ui/bank-details/bank-details.component';
import {
  hasOtherErrorKind,
  requireParseableDate,
} from '../../../@shared/util/forms/form-rules';
import { CASH_TRANSACTIONS_LIST_ID } from '../../model/cash.types';
import {
  CashTransaction,
  CashTransactionStatus,
} from '../../model/transaction.types';
import {
  CashRulesFacade,
  CashSchedulesFacade,
  CashTransactionsFacade,
} from '../../data';
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
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonListHeader,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    TranslatePipe,
    ItemEditModalComponent,
    CashBankDetailsComponent,
    CashCategoryPickerComponent,
    MoneyInputComponent,
  ],
})
export class EditCashTransactionDialogComponent extends BaseEditItemDialog<
  CashTransaction,
  TransactionForm
> {
  readonly #facade = inject(CashTransactionsFacade);
  readonly #rules = inject(CashRulesFacade);
  readonly #schedules = inject(CashSchedulesFacade);

  protected readonly listId: ItemListId = CASH_TRANSACTIONS_LIST_ID;
  readonly siblings = this.#facade.allItems;

  protected override uniqueName(): boolean {
    return false;
  }

  constructor() {
    super();
    addIcons({ funnelOutline, repeatOutline });
  }

  readonly amountInvalid = hasOtherErrorKind(
    this.form.amountCents,
    MISSING_AMOUNT
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
    const reclassified = categoryId !== categoryIdOf(seed);
    return {
      ...seed,
      name: draft.name.trim(),
      amountCents: draft.direction === 'expense' ? -magnitude : magnitude,
      dateISO: dayjs(draft.date).format(),
      status,
      categoryIds: categoryId ? [categoryId] : undefined,
      categoryManual: reclassified || seed.categoryManual,
    };
  }

  protected save(item: CashTransaction): void {
    this.#facade.saveItem(item);
  }

  readonly canDerive = computed(() => {
    const seed = this.seedItem();
    return !!seed && this.siblings().some(({ id }) => id === seed.id);
  });

  deriveRule(): void {
    const txn = this.#committed();
    if (txn) this.#rules.deriveFrom(txn);
  }

  deriveSchedule(): void {
    const txn = this.#committed();
    if (txn) this.#schedules.deriveFrom(txn);
  }

  #committed(): CashTransaction | undefined {
    const seed = this.seedItem();
    if (!seed || !this.canSave()) return seed;
    const edited = this.fromForm(this.draft(), seed);
    this.#facade.saveItem(edited);
    return edited;
  }
}
