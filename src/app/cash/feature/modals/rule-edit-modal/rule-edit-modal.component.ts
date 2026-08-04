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
  CashRule,
  FilterField,
  FilterOperation,
  OP_LABEL_KEYS,
  RuleForm,
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
import { LanguageService } from '../../../../@shared/data/theme/language.service';
import { Category, CategoryId } from '../../../../@shared/model/category.types';

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
  CashRule,
  RuleForm
> {
  readonly #facade = inject(CashFacade);
  readonly #rules = this.#facade.rules;
  readonly categories = this.#facade.categories;

  set ruleId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<CashRule | undefined>(() => {
    const id = this.editId();
    return id ? this.#rules().find((rule) => rule.id === id) : undefined;
  });

  readonly #language = inject(LanguageService).language;

  protected applyRules(path: SchemaPathTree<RuleForm>): void {
    ruleRulesFor(() => this.#language())(path);
  }

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

  protected blank(): RuleForm {
    return {
      name: '',
      match: 'all',
      categoryId: '',
      conditions: [blankCondition()],
    };
  }

  protected toForm(rule: CashRule): RuleForm {
    return {
      name: rule.name ?? '',
      match: rule.match,
      categoryId: rule.categoryId,
      conditions: rule.conditions.map((condition) =>
        toConditionForm(condition)
      ),
    };
  }

  protected persist(draft: RuleForm, existing: CashRule | undefined): void {
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
        order: Math.max(-1, ...this.#rules().map((rule) => rule.order)) + 1,
        ...fields,
      });
    }
  }

  readonly opLabelKeys = OP_LABEL_KEYS;

  readonly opsFor: (field: FilterField) => readonly FilterOperation[] = opsFor;

  onAddCategory(category: Category): void {
    this.#facade.addCategory(category);
  }

  onDeleteCategory(id: CategoryId): void {
    this.#facade.removeCategory(id);
  }

  onRenameCategory({ id, to }: { id: CategoryId; to: string }): void {
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

  onField(index: number, field: FilterField): void {
    this.patch({
      conditions: this.draft().conditions.map((condition, at) =>
        at === index
          ? { ...condition, field, op: DEFAULT_OP_BY_FIELD[field] }
          : condition
      ),
    });
  }
}
