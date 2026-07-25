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
  IonList,
  IonListHeader,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import { ICategory, TCategoryId } from '../../../@shared/model/types';
import {
  ICashFilterCondition,
  ICashRule,
  TAmountOp,
  TDescriptionOp,
  TFilterField,
  TFilterOp,
} from '../../model';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { CashCategoryPickerComponent } from '../../ui/cash-category-picker/cash-category-picker.component';
import { CashFacade } from '../../data';

const DESCRIPTION_OPS: readonly TDescriptionOp[] = [
  'contains',
  'startsWith',
  'endsWith',
  'equals',
  'regex',
];
const AMOUNT_OPS: readonly TAmountOp[] = ['eq', 'lt', 'lte', 'gt', 'gte'];

// The op labels render via `'cash.op.' + op | translate` in the template, so the
// concrete keys are invisible to the i18n extractor — register each explicitly.
marker('cash.op.contains');
marker('cash.op.startsWith');
marker('cash.op.endsWith');
marker('cash.op.equals');
marker('cash.op.regex');
marker('cash.op.eq');
marker('cash.op.lt');
marker('cash.op.lte');
marker('cash.op.gt');
marker('cash.op.gte');

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
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    TranslateModule,
    CashCategoryPickerComponent,
  ],
})
export class CashRuleEditModalComponent implements OnInit {
  readonly #facade = inject(CashFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #rules = this.#facade.rules;
  readonly categories = this.#facade.categories;

  /** undefined = create mode. */
  ruleId?: string;

  readonly name = signal('');
  readonly match = signal<'all' | 'any'>('all');
  // The category id this rule assigns ('' = none).
  readonly categoryId = signal<TCategoryId>('');
  readonly conditions = signal<ICashFilterCondition[]>([newCondition()]);

  readonly isEdit = computed(() => !!this.ruleId);
  readonly canSave = computed(
    () =>
      this.categoryId().trim().length > 0 &&
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
    this.categoryId.set(existing.categoryId);
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

  addCondition(): void {
    this.conditions.update((list) => [...list, newCondition()]);
  }

  removeCondition(index: number): void {
    this.conditions.update((list) =>
      list.filter((_, index_) => index_ !== index)
    );
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
    const categoryId = this.categoryId().trim();
    const conditions = this.conditions().map((c) => ({
      ...c,
      value: c.value.trim(),
    }));
    const existing = this.#existing();
    if (existing) {
      this.#facade.updateRule({
        ...existing,
        name,
        match,
        categoryId,
        conditions,
      });
    } else {
      const rule: ICashRule = {
        id: uuidv4(),
        order: this.#rules().length,
        name,
        match,
        categoryId,
        conditions,
      };
      this.#facade.addRule(rule);
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }

  #patchCondition(index: number, patch: Partial<ICashFilterCondition>): void {
    this.conditions.update((list) =>
      list.map((c, index_) => (index_ === index ? { ...c, ...patch } : c))
    );
  }

  #existing(): ICashRule | undefined {
    return this.ruleId
      ? this.#rules().find((r) => r.id === this.ruleId)
      : undefined;
  }
}
