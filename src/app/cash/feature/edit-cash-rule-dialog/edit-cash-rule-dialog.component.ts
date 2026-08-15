/* ─── why ─────────────────────────────────────────────────────────
 * `uniqueName` is off because a rule's name is a label the user may
 * leave blank — it then takes its target category's name, and two rules
 * filing into the same category are a normal thing to want.
 *
 * The form is not the entity because a stored condition threshold is a
 * canonical de-formatted string while the field shows the user's own
 * locale, so `toCondition` / `toConditionForm` sit on the boundary.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormField, SchemaPathTree } from '@angular/forms/signals';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { LanguageService } from '../../../@shared/data/theme/language.service';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { CASH_RULES_LIST_ID } from '../../model/cash.types';
import {
  CashRule,
  FilterField,
  FilterOperation,
  OP_LABEL_KEYS,
  RuleForm,
} from '../../model/rule.types';
import { CashRulesFacade } from '../../data';
import { CashCategoryPickerComponent } from '../../smart-ui/cash-category-picker/cash-category-picker.component';
import { createCashRule } from '../../util/cash.factory';
import {
  blankCondition,
  DEFAULT_OP_BY_FIELD,
  opsFor,
  ruleRulesFor,
  toCondition,
  toConditionForm,
  UNPARSEABLE_AMOUNT,
} from '../../util/rule-form.utils';

@Component({
  selector: 'app-edit-cash-rule-dialog',
  templateUrl: './edit-cash-rule-dialog.component.html',
  styleUrls: ['./edit-cash-rule-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonListHeader,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonToggle,
    TranslatePipe,
    ItemEditModalComponent,
    CashCategoryPickerComponent,
  ],
})
export class EditCashRuleDialogComponent extends BaseEditItemDialog<
  CashRule,
  RuleForm
> {
  readonly #facade = inject(CashRulesFacade);
  readonly #language = inject(LanguageService).language;

  protected readonly listId: ItemListId = CASH_RULES_LIST_ID;
  readonly siblings = this.#facade.allItems;

  readonly opLabelKeys = OP_LABEL_KEYS;
  readonly opsFor: (field: FilterField) => readonly FilterOperation[] = opsFor;

  protected override uniqueName(): boolean {
    return false;
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

  protected override extraRules(path: SchemaPathTree<RuleForm>): void {
    ruleRulesFor(() => this.#language())(path);
  }

  protected blank(): CashRule {
    return createCashRule('', '', this.#nextOrder());
  }

  protected override toForm(rule: CashRule): RuleForm {
    return {
      name: rule.name,
      match: rule.match,
      categoryId: rule.categoryId,
      conditions: rule.conditions.map((condition) =>
        toConditionForm(condition)
      ),
    };
  }

  protected override fromForm(draft: RuleForm, seed: CashRule): CashRule {
    return {
      ...seed,
      name: draft.name.trim(),
      match: draft.match,
      categoryId: draft.categoryId.trim(),
      conditions: draft.conditions.map((condition) =>
        toCondition(condition, this.#language())
      ),
    };
  }

  protected save(item: CashRule): void {
    this.#facade.saveItem(item);
  }

  #nextOrder(): number {
    return Math.max(-1, ...this.siblings().map((rule) => rule.order)) + 1;
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
