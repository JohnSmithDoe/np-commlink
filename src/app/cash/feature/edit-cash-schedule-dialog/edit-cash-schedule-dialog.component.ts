/* ─── why ─────────────────────────────────────────────────────────
 * `amountCents` is entered as a magnitude and stored signed, like a booking:
 * the form asks for "how much leaves" and negates it, so a schedule and the
 * transaction it recognises compare directly rather than through an abs().
 *
 * `uniqueName` is off for the same reason the rule dialog turns it off — the
 * name is a label, and two schedules may reasonably share one.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  FormField,
  min,
  SchemaPathTree,
  validate,
} from '@angular/forms/signals';
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
import dayjs from 'dayjs';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { LanguageService } from '../../../@shared/data/theme/language.service';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { requireParseableDate } from '../../../@shared/util/forms/form-rules';
import { CASH_SCHEDULES_LIST_ID } from '../../model/cash.types';
import {
  ConditionSet,
  FIELD_LABEL_KEYS,
  FilterField,
  FilterOperation,
  isTextFilterField,
  OP_LABEL_KEYS,
  TEXT_FILTER_FIELDS,
} from '../../model/rule.types';
import { CashSchedule, ScheduleForm } from '../../model/schedule.types';
import { CashSchedulesFacade } from '../../data';
import { CashCategoryPickerComponent } from '../../smart-ui/cash-category-picker/cash-category-picker.component';
import { CashMatchPreviewComponent } from '../../smart-ui/match-preview/match-preview.component';
import { MoneyInputComponent } from '../../ui/money-input/money-input.component';
import { createCashSchedule } from '../../util/cash.factory';
import {
  blankCondition,
  defaultOpFor,
  opsFor,
  toCondition,
  toConditionForm,
} from '../../util/rule-form.utils';

const PERIOD_MONTHS = [1, 3, 6, 12] as const;
const MISSING_AMOUNT = { kind: 'missingAmount' } as const;

@Component({
  selector: 'app-edit-cash-schedule-dialog',
  templateUrl: './edit-cash-schedule-dialog.component.html',
  styleUrls: ['./edit-cash-schedule-dialog.component.scss'],
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
    CashMatchPreviewComponent,
    MoneyInputComponent,
  ],
})
export class EditCashScheduleDialogComponent extends BaseEditItemDialog<
  CashSchedule,
  ScheduleForm
> {
  readonly #facade = inject(CashSchedulesFacade);
  readonly #language = inject(LanguageService).language;

  protected readonly listId: ItemListId = CASH_SCHEDULES_LIST_ID;
  readonly siblings = this.#facade.allItems;

  readonly opLabelKeys = OP_LABEL_KEYS;
  readonly fieldLabelKeys = FIELD_LABEL_KEYS;
  readonly textFields = TEXT_FILTER_FIELDS;
  readonly periods = PERIOD_MONTHS;
  readonly opsFor: (field: FilterField) => readonly FilterOperation[] = opsFor;
  readonly isTextField = isTextFilterField;

  protected override uniqueName(): boolean {
    return false;
  }

  readonly amountInvalid = computed(() =>
    this.form
      .amountCents()
      .errors()
      .some(({ kind }) => kind !== MISSING_AMOUNT.kind)
  );

  readonly conditionSet = computed<ConditionSet>(() => ({
    match: this.draft().match,
    conditions: this.draft().conditions.map((condition) =>
      toCondition(condition, this.#language())
    ),
  }));

  constructor() {
    super();
    addIcons({ addOutline, closeOutline });
  }

  protected override extraRules(path: SchemaPathTree<ScheduleForm>): void {
    validate(path.amountCents, ({ value }) =>
      value() === null ? MISSING_AMOUNT : null
    );
    min(path.amountCents, 1);
    requireParseableDate(path.nextDue);
  }

  protected blank(): CashSchedule {
    return createCashSchedule('');
  }

  protected override toForm(schedule: CashSchedule): ScheduleForm {
    return {
      name: schedule.name,
      match: schedule.match,
      categoryId: schedule.categoryId ?? '',
      amountCents: schedule.amountCents ? Math.abs(schedule.amountCents) : null,
      periodMonths: schedule.periodMonths,
      nextDue: dayjs(schedule.nextDueISO).format('YYYY-MM-DD'),
      conditions: schedule.conditions.map((condition) =>
        toConditionForm(condition)
      ),
    };
  }

  protected override fromForm(
    draft: ScheduleForm,
    seed: CashSchedule
  ): CashSchedule {
    const categoryId = draft.categoryId.trim() || undefined;
    return {
      ...seed,
      name: draft.name.trim(),
      match: draft.match,
      categoryId,
      amountCents: -(draft.amountCents ?? 0),
      periodMonths: draft.periodMonths,
      nextDueISO: dayjs(draft.nextDue).format(),
      conditions: draft.conditions.map((condition) =>
        toCondition(condition, this.#language())
      ),
    };
  }

  protected save(item: CashSchedule): void {
    this.#facade.saveItem(item);
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
