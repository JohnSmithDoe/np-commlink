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
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import {
  ICashFilterCondition,
  ICashRule,
  TAmountOp,
  TDescriptionOp,
  TFilterField,
  TFilterOp,
} from '../../../@shared/types';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { CashActions } from '../../data/cash.actions';
import {
  selectCashCategories,
  selectCashRules,
} from '../../data/cash.selector';

const DESCRIPTION_OPS: readonly TDescriptionOp[] = [
  'contains',
  'startsWith',
  'endsWith',
  'equals',
  'regex',
];
const AMOUNT_OPS: readonly TAmountOp[] = ['eq', 'lt', 'lte', 'gt', 'gte'];

const newCondition = (): ICashFilterCondition => ({
  field: 'description',
  op: 'contains',
  value: '',
});

/**
 * Create/edit an email-style categorization rule (via `ModalController`).
 * `ruleId` is an imperative componentProp (undefined = create). The condition
 * builder mirrors the model: each row is field · op (op set depends on field) ·
 * value · (description-only) case-sensitivity. `match` chooses AND vs OR.
 */
@Component({
  selector: 'app-cash-rule-edit-modal',
  templateUrl: './rule-edit-modal.component.html',
  styleUrls: ['./rule-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    TranslateModule,
  ],
})
export class CashRuleEditModalComponent implements OnInit {
  readonly #store = inject(Store);
  readonly #modalCtrl = inject(ModalController);
  readonly #rules = this.#store.selectSignal(selectCashRules);
  readonly categories = this.#store.selectSignal(selectCashCategories);

  /** undefined = create mode. */
  ruleId?: string;

  readonly name = signal('');
  readonly match = signal<'all' | 'any'>('all');
  readonly category = signal('');
  readonly conditions = signal<ICashFilterCondition[]>([newCondition()]);

  readonly isEdit = computed(() => !!this.ruleId);
  readonly canSave = computed(
    () =>
      this.category().trim().length > 0 &&
      this.conditions().length > 0 &&
      this.conditions().every((c) => c.value.trim().length > 0)
  );

  constructor() {
    addIcons({ addOutline, closeOutline });
  }

  ngOnInit(): void {
    const existing = this.#existing();
    if (!existing) return;
    this.name.set(existing.name ?? '');
    this.match.set(existing.match);
    this.category.set(existing.category);
    this.conditions.set(existing.conditions.map((c) => ({ ...c })));
  }

  opsFor(field: TFilterField): readonly TFilterOp[] {
    return field === 'amount' ? AMOUNT_OPS : DESCRIPTION_OPS;
  }

  onName(value: string): void {
    this.name.set(value);
  }

  onMatch(value: 'all' | 'any'): void {
    this.match.set(value);
  }

  onCategory(value: string): void {
    this.category.set(value);
  }

  addCondition(): void {
    this.conditions.update((list) => [...list, newCondition()]);
  }

  removeCondition(index: number): void {
    this.conditions.update((list) => list.filter((_, i) => i !== index));
  }

  onField(index: number, field: TFilterField): void {
    // Reset op to the first valid one for the new field so it can never be a
    // string op on `amount` (or vice versa).
    const op = this.opsFor(field)[0];
    this.#patchCondition(index, { field, op });
  }

  onOp(index: number, op: TFilterOp): void {
    this.#patchCondition(index, { op });
  }

  onValue(index: number, value: string): void {
    this.#patchCondition(index, { value });
  }

  onCaseSensitive(index: number, caseSensitive: boolean): void {
    this.#patchCondition(index, { caseSensitive });
  }

  save(): void {
    if (!this.canSave()) return;
    const name = this.name().trim() || undefined;
    const match = this.match();
    const category = this.category().trim();
    const conditions = this.conditions().map((c) => ({
      ...c,
      value: c.value.trim(),
    }));
    const existing = this.#existing();
    if (existing) {
      this.#store.dispatch(
        CashActions.updateRule({
          ...existing,
          name,
          match,
          category,
          conditions,
        })
      );
    } else {
      const rule: ICashRule = {
        id: uuidv4(),
        order: this.#rules().length,
        name,
        match,
        category,
        conditions,
      };
      this.#store.dispatch(CashActions.addRule(rule));
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }

  #patchCondition(index: number, patch: Partial<ICashFilterCondition>): void {
    this.conditions.update((list) =>
      list.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  #existing(): ICashRule | undefined {
    return this.ruleId
      ? this.#rules().find((r) => r.id === this.ruleId)
      : undefined;
  }
}
