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
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import {
  ICashFilterCondition,
  ICashRule,
  TAmountOp,
  TDescriptionOp,
  TFilterField,
  TFilterOp,
} from '../../model/rule.types';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { CashCategoryPickerComponent } from '../../ui/cash-category-picker/cash-category-picker.component';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import { CashFacade } from '../../data';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

// `name` is optional on ICashRule but always a string in the form, and the
// conditions are copied so a cancel discards edits — hence a view-model.
type TRuleForm = {
  name: string;
  match: 'all' | 'any';
  // '' = none.
  categoryId: TCategoryId;
  conditions: ICashFilterCondition[];
};

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
 * Create/edit an email-style categorization rule (via `ModalController`). The
 * condition builder mirrors the model: each row is field · op (op set depends on
 * field) · value · (description-only) case-sensitivity. `match` chooses AND vs OR.
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
export class CashRuleEditModalComponent extends BaseModalDialog<
  ICashRule,
  TRuleForm
> {
  readonly #facade = inject(CashFacade);
  readonly #rules = this.#facade.rules;
  readonly categories = this.#facade.categories;

  /** Set imperatively via `componentProps`; undefined = create mode. */
  set ruleId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<ICashRule | undefined>(() => {
    const id = this.editId();
    return id ? this.#rules().find((rule) => rule.id === id) : undefined;
  });

  readonly canSave = computed(() => {
    const { categoryId, conditions } = this.draft();
    return (
      categoryId.trim().length > 0 &&
      conditions.length > 0 &&
      conditions.every((condition) => condition.value.trim().length > 0)
    );
  });

  constructor() {
    super();
    addIcons({ addOutline, closeOutline });
  }

  protected blank(): TRuleForm {
    return {
      name: '',
      match: 'all',
      categoryId: '',
      conditions: [newCondition()],
    };
  }

  protected toForm(rule: ICashRule): TRuleForm {
    return {
      name: rule.name ?? '',
      match: rule.match,
      categoryId: rule.categoryId,
      conditions: rule.conditions.map((condition) => ({ ...condition })),
    };
  }

  protected persist(draft: TRuleForm, existing: ICashRule | undefined): void {
    const fields = {
      name: draft.name.trim() || undefined,
      match: draft.match,
      categoryId: draft.categoryId.trim(),
      conditions: draft.conditions.map((condition) => ({
        ...condition,
        value: condition.value.trim(),
      })),
    };
    if (existing) {
      this.#facade.updateRule({ ...existing, ...fields });
    } else {
      this.#facade.addRule({
        id: uuidv4(),
        order: this.#rules().length,
        ...fields,
      });
    }
  }

  opsFor(field: TFilterField): readonly TFilterOp[] {
    return field === 'amount' ? AMOUNT_OPS : DESCRIPTION_OPS;
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
    this.patch({ conditions: [...this.draft().conditions, newCondition()] });
  }

  removeCondition(index: number): void {
    this.patch({
      conditions: this.draft().conditions.filter(
        (_, index_) => index_ !== index
      ),
    });
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

  #patchCondition(
    index: number,
    condition: Partial<ICashFilterCondition>
  ): void {
    this.patch({
      conditions: this.draft().conditions.map((current, index_) =>
        index_ === index ? { ...current, ...condition } : current
      ),
    });
  }
}
