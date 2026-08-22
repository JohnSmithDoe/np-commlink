/* ─── why ─────────────────────────────────────────────────────────
 * A daily spend is typed at a counter, so the composer holds plain signals
 * rather than a form: there is nothing to validate but "is there an amount
 * and somewhere to book it", and no dialog to open and dismiss.
 *
 * The account is DERIVED from the method, and the picker appears only when
 * the method leaves a genuine choice — one cash tin and one card means two
 * taps, and a select offering a single option is a question with one answer.
 * A stale `chosenAccountId` needs no reset when the method flips, because it
 * falls out of the new candidate list and the fallback takes over.
 *
 * The booking's name is the category's, since for a daily spend the category
 * IS the description; the method label stands in when nothing was picked.
 * `addListItem` silently drops a row with an empty name, so this must never
 * resolve to one.
 *
 * The presets are the notes actually handed over at a counter, not a scale —
 * cash gets rounded up, so the amount is far more often one of four figures
 * than it is exact. Tapping the chosen one again clears it, which is the only
 * way back from a mis-tap that does not summon the keypad.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CategoryId } from '../../../@shared/model/category.types';
import {
  CashAccount,
  PAYMENT_METHOD_EMPTY_KEYS,
  PAYMENT_METHOD_LABEL_KEYS,
  PaymentMethod,
} from '../../model/account.types';
import {
  CashAccountsFacade,
  CashCategoriesFacade,
  CashTransactionsFacade,
} from '../../data';
import { CashCategoryPickerComponent } from '../../smart-ui/cash-category-picker/cash-category-picker.component';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { MoneyInputComponent } from '../../ui/money-input/money-input.component';
import { accountsForMethod, createCashSpend } from '../../util/spend.utils';

const PAYMENT_METHODS = Object.keys(
  PAYMENT_METHOD_LABEL_KEYS
) as readonly PaymentMethod[];

const PRESET_CENTS: readonly number[] = [500, 1000, 1200, 1500];

@Component({
  selector: 'app-cash-spend-quick-add',
  templateUrl: './spend-quick-add.component.html',
  styleUrls: ['./spend-quick-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonItem,
    IonLabel,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
    CashCategoryPickerComponent,
    MoneyEurPipe,
    MoneyInputComponent,
  ],
})
export class CashSpendQuickAddComponent {
  readonly #accounts = inject(CashAccountsFacade);
  readonly #categories = inject(CashCategoriesFacade);
  readonly #transactions = inject(CashTransactionsFacade);
  readonly #translate = inject(TranslateService);

  readonly methods = PAYMENT_METHODS;
  readonly methodLabelKeys = PAYMENT_METHOD_LABEL_KEYS;
  readonly emptyLabelKeys = PAYMENT_METHOD_EMPTY_KEYS;
  readonly presets = PRESET_CENTS;

  readonly amountCents = signal<number | null>(null);
  readonly method = signal<PaymentMethod>('cash');
  readonly categoryId = signal<CategoryId>('');
  readonly chosenAccountId = signal<string>('');

  readonly accounts = computed(() =>
    accountsForMethod(this.#accounts.allItems(), this.method())
  );

  readonly account = computed<CashAccount | undefined>(() => {
    const candidates = this.accounts();
    return (
      candidates.find(({ id }) => id === this.chosenAccountId()) ??
      candidates[0]
    );
  });

  readonly needsAccountChoice = computed(() => this.accounts().length > 1);
  readonly hasNoAccount = computed(() => this.accounts().length === 0);
  readonly settlesLater = computed(() => this.method() === 'card');

  readonly canBook = computed(
    () => !!this.account() && (this.amountCents() ?? 0) > 0
  );

  setMethod(method: PaymentMethod): void {
    this.method.set(method);
  }

  chooseAccount(accountId: string): void {
    this.chosenAccountId.set(accountId);
  }

  pickPreset(cents: number): void {
    this.amountCents.set(this.amountCents() === cents ? null : cents);
  }

  book(): void {
    const account = this.account();
    const amount = this.amountCents();
    if (!account || !amount) return;

    const categoryId = this.categoryId().trim() || undefined;
    this.#transactions.saveItem(
      createCashSpend(
        this.#name(categoryId),
        account.id,
        amount,
        this.method(),
        categoryId
      )
    );
    this.amountCents.set(null);
  }

  #name(categoryId?: CategoryId): string {
    const category = this.#categories
      .allItems()
      .find(({ id }) => id === categoryId);
    return (
      category?.name.trim() ||
      this.#translate.instant(PAYMENT_METHOD_LABEL_KEYS[this.method()])
    );
  }
}
