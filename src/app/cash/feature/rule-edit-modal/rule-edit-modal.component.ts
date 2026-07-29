import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  applyEach,
  form,
  FormField,
  SchemaFn,
  validate,
} from '@angular/forms/signals';
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
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
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
import { requireText } from '../../../@shared/util/form-rules';
import { CashFacade } from '../../data';
import { centsToInput, eurToCents } from '../../util/money.utils';
import { LanguageService } from '../../../@shared/util/language.service';
import { TLanguage } from '../../../@shared/model/app.types';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

// `caseSensitive` is optional on the entity but always a boolean here, so the
// toggle has a field to bind to — hence a view-model, not a copy.
type TConditionForm = {
  field: TFilterField;
  op: TFilterOp;
  value: string;
  caseSensitive: boolean;
};

// `name` is optional on ICashRule but always a string in the form, and the
// conditions are copied so a cancel discards edits — hence a view-model.
type TRuleForm = {
  name: string;
  match: 'all' | 'any';
  // '' = none.
  categoryId: TCategoryId;
  conditions: TConditionForm[];
};

const DESCRIPTION_OPS: readonly TDescriptionOp[] = [
  'contains',
  'startsWith',
  'endsWith',
  'equals',
  'regex',
];
const AMOUNT_OPS: readonly TAmountOp[] = ['eq', 'lt', 'lte', 'gt', 'gte'];

// Typed per field rather than as a `Record<TFilterField, TFilterOp>`: `TFilterOp`
// is the union of both op sets, so the looser type would happily file a numeric
// op under `description` — the exact swap this table exists to prevent.
const DEFAULT_OP_BY_FIELD: {
  description: TDescriptionOp;
  amount: TAmountOp;
} = {
  description: 'contains',
  amount: 'eq',
};

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

const NO_CONDITIONS = { kind: 'noConditions' } as const;
const UNPARSEABLE_AMOUNT = { kind: 'unparseableAmount' } as const;

// An unparseable amount threshold is its own kind for two reasons: only it earns
// a visible note, and `matchesAmountCondition` reads one as "never matches", so a
// rule saved with `abc` would sit in the list looking armed and never fire.
// A factory rather than a const because the amount threshold is validated in the
// language the user is typing: `12.34` is an amount under `en` and junk under
// `de`. The language is fixed for the session (a switch restarts the app), so
// building the schema once per dialog is enough.
const ruleRulesFor =
  (language: TLanguage): SchemaFn<TRuleForm> =>
  (path) => {
    requireText(path.categoryId);
    validate(path.conditions, ({ value }) =>
      value().length === 0 ? NO_CONDITIONS : null
    );
    applyEach(path.conditions, (condition) => {
      requireText(condition.value);
      validate(condition.value, ({ value, valueOf }) => {
        const threshold = valueOf(condition.field) === 'amount';
        return threshold && eurToCents(value(), language) === null
          ? UNPARSEABLE_AMOUNT
          : null;
      });
    });
  };

const newCondition = (): TConditionForm => ({
  field: 'description',
  op: 'contains',
  value: '',
  caseSensitive: false,
});

const toConditionForm = ({
  field,
  op,
  value,
  caseSensitive,
}: ICashFilterCondition): TConditionForm => ({
  field,
  op,
  value,
  caseSensitive: caseSensitive ?? false,
});

// The amount matcher ignores case-sensitivity, so a numeric condition must not
// carry a flag that can never apply. An amount is also normalized onto the
// canonical German storage form here: the matcher reads a stored threshold as
// German by construction (see `categorize.utils`), because the two conventions
// are ambiguous and a language switch must not re-interpret an existing rule.
const toCondition = (
  { field, op, value, caseSensitive }: TConditionForm,
  language: TLanguage
): ICashFilterCondition =>
  field === 'amount'
    ? { field, op, value: toStoredThreshold(value, language) }
    : { field, op, value: value.trim(), caseSensitive };

const toStoredThreshold = (value: string, language: TLanguage): string => {
  const cents = eurToCents(value, language);
  return cents === null ? value.trim() : centsToInput(cents, 'de');
};

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
    FormField,
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
    IonNote,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    TranslatePipe,
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

  // `form` projects the draft signal rather than copying it, so the base's
  // reseed-on-`existing()` still reaches every field.
  readonly #language = inject(LanguageService).language;
  protected readonly form = form(this.draft, ruleRulesFor(this.#language()));

  /** Per condition row, so the note sits under the row that earned it. */
  readonly amountInvalidRows = computed(() =>
    [...this.form.conditions].map((condition) =>
      condition
        .value()
        .errors()
        .some(({ kind }) => kind === UNPARSEABLE_AMOUNT.kind)
    )
  );

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
      conditions: rule.conditions.map((condition) =>
        toConditionForm(condition)
      ),
    };
  }

  protected persist(draft: TRuleForm, existing: ICashRule | undefined): void {
    const fields = {
      name: draft.name.trim() || undefined,
      match: draft.match,
      categoryId: draft.categoryId.trim(),
      conditions: draft.conditions.map((condition) =>
        toCondition(condition, this.#language())
      ),
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

  /**
   * The field select drives two fields: switching to `amount` must reset the op
   * to a numeric one, or a string op would stay on a numeric field and could
   * never match. That write is why this one control stays off `[formField]`.
   */
  onField(index: number, field: TFilterField): void {
    this.patch({
      conditions: this.draft().conditions.map((condition, at) =>
        at === index
          ? { ...condition, field, op: DEFAULT_OP_BY_FIELD[field] }
          : condition
      ),
    });
  }
}
