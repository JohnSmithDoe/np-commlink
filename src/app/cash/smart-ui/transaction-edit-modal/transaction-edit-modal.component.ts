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
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { ICategory, TCategoryId } from '../../../@shared/types';
import { ICashTransaction, TCashTxnStatus } from '../../model';
import { matchingTxt, uuidv4 } from '../../../@shared/util/app.utils';
import { categoriesByIds } from '../../../@shared/util/category.utils';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import {
  CashActions,
  selectCashCategories,
  selectCashTransactions,
} from '../../data';
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
    CategoryInputComponent,
    CategoriesDialogComponent,
  ],
})
export class CashTransactionEditModalComponent implements OnInit {
  readonly #store = inject(Store);
  readonly #modalCtrl = inject(ModalController);
  readonly #transactions = this.#store.selectSignal(selectCashTransactions);
  readonly categories = this.#store.selectSignal(selectCashCategories);
  readonly categoriesDialogOpen = signal(false);

  /** Create mode: the account the new txn belongs to. */
  accountId!: string;
  /** Edit mode: the txn being edited (undefined = create). */
  transactionId?: string;

  readonly description = signal('');
  readonly amount = signal('');
  readonly direction = signal<TDirection>('expense');
  readonly date = signal(dayjs().format('YYYY-MM-DD'));
  readonly pending = signal(false);
  // The selected category id ('' = none) + its resolved {id,name} for the chip.
  readonly categoryId = signal<TCategoryId>('');
  readonly selectedCategories = computed<ICategory[]>(() =>
    categoriesByIds(
      this.categoryId() ? [this.categoryId()] : [],
      this.categories()
    )
  );

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

  // Single-select category via the shared picker (a txn has one category).
  openCategoriesDialog(): void {
    this.categoriesDialogOpen.set(true);
  }

  closeCategoriesDialog(): void {
    this.categoriesDialogOpen.set(false);
  }

  onPickCategory(selection: TCategoryId[]): void {
    this.categoryId.set(selection[0] ?? '');
    this.categoriesDialogOpen.set(false);
  }

  clearCategory(): void {
    this.categoryId.set('');
  }

  onAddCategory(category: ICategory): void {
    this.#store.dispatch(CashActions.addCategory(category));
  }

  onDeleteCategory(id: TCategoryId): void {
    this.#store.dispatch(CashActions.removeCategory(id));
    if (this.categoryId() === id) this.categoryId.set('');
  }

  onRenameCategory({ id, to }: { id: TCategoryId; to: string }): void {
    // A rename onto an existing name merges in the reducer (the id is dropped
    // and its txns remapped to the survivor); follow the survivor so save()
    // doesn't re-assert the now-orphan id from the local draft.
    const survivor = this.categories().find(
      (c) => c.id !== id && matchingTxt(c.name) === matchingTxt(to)
    );
    this.#store.dispatch(CashActions.updateCategory(id, to));
    if (survivor && this.categoryId() === id) this.categoryId.set(survivor.id);
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
      this.#store.dispatch(
        CashActions.updateTransaction({ ...existing, ...patch })
      );
    } else {
      const transaction: ICashTransaction = {
        id: uuidv4(),
        accountId: this.accountId,
        source: 'manual',
        ...patch,
      };
      this.#store.dispatch(CashActions.addTransaction(transaction));
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
