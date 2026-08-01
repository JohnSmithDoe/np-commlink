import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormField, SchemaPathTree } from '@angular/forms/signals';
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
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import {
  ICashRule,
  OP_LABEL_KEYS,
  TFilterField,
  TFilterOp,
  TRuleForm,
} from '../../../model/rule.types';
import { uuidv4 } from '../../../../@shared/util/app.utils';
import { CashCategoryPickerComponent } from '../../../ui/cash-category-picker/cash-category-picker.component';
import { BaseModalDialog } from '../../../../@shared/feature/modal-dialog/base-modal-dialog';
import { CashFacade } from '../../../data';
import {
  blankCondition,
  DEFAULT_OP_BY_FIELD,
  opsFor,
  ruleRulesFor,
  toCondition,
  toConditionForm,
  UNPARSEABLE_AMOUNT,
} from '../../../util/rule-form.utils';
import { LanguageService } from '../../../../@shared/util/theme/language.service';
import {
  ICategory,
  TCategoryId,
} from '../../../../@shared/model/category.types';

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

  readonly #language = inject(LanguageService).language;

  protected applyRules(path: SchemaPathTree<TRuleForm>): void {
    ruleRulesFor(() => this.#language())(path);
  }

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
      conditions: [blankCondition()],
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
        // Past the highest, not the count: after any delete the count collides
        // with an order still in use, and two rules claiming one position leave
        // the tie to `toSorted`'s stability rather than to the user's arrangement.
        order: Math.max(-1, ...this.#rules().map((rule) => rule.order)) + 1,
        ...fields,
      });
    }
  }

  readonly opLabelKeys = OP_LABEL_KEYS;

  // Exposed for the template, not re-implemented: a method wrapping the import
  // of the same name would shadow it in every reader's head.
  readonly opsFor: (field: TFilterField) => readonly TFilterOp[] = opsFor;

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
    this.patch({ conditions: [...this.draft().conditions, blankCondition()] });
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
