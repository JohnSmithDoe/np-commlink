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
  IonListHeader,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { LanguageService } from '../../../@shared/data/theme/language.service';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { CASH_RULES_LIST_ID } from '../../model/cash.types';
import {
  CashRule,
  ConditionSet,
  FilterField,
  RuleForm,
} from '../../model/rule.types';
import { CashRulesFacade } from '../../data';
import { CashCategoryPickerComponent } from '../../smart-ui/cash-category-picker/cash-category-picker.component';
import { CashMatchPreviewComponent } from '../../smart-ui/match-preview/match-preview.component';
import { CashConditionRowsComponent } from '../../ui/condition-rows/condition-rows.component';
import { createCashRule } from '../../util/cash.factory';
import {
  blankCondition,
  defaultOpFor,
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
    IonListHeader,
    IonSegment,
    IonSegmentButton,
    TranslatePipe,
    ItemEditModalComponent,
    CashCategoryPickerComponent,
    CashConditionRowsComponent,
    CashMatchPreviewComponent,
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

  protected override uniqueName(): boolean {
    return false;
  }

  readonly conditionSet = computed<ConditionSet>(() => ({
    match: this.draft().match,
    conditions: this.draft().conditions.map((condition) =>
      toCondition(condition, this.#language())
    ),
  }));

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
    addIcons({ addOutline });
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
          ? { ...condition, field, op: defaultOpFor(field) }
          : condition
      ),
    });
  }
}
