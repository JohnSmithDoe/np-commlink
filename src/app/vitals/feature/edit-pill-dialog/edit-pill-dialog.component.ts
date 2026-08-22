/* ─── why ─────────────────────────────────────────────────────────
 * `takenToday` is in the form but not in the pill: an intake is a fact
 * about a DAY, and writing it into the entity would leave yesterday's tick
 * standing as today's. `save` splits the two apart again, which is also
 * why the tick is a field here rather than a control in the row — the row
 * would have to answer "taken when" on every render.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormField, SchemaPathTree, validate } from '@angular/forms/signals';
import {
  IonInput,
  IonItem,
  IonNote,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { IsoWeekday } from '../../../@shared/model/app.types';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import {
  clockTime,
  parseClock,
} from '../../../@shared/util/formatting/date-format.utils';
import { hasErrorKind } from '../../../@shared/util/forms/form-rules';
import { PillsFacade, ProfilesFacade } from '../../data';
import { Pill, PILLS_LIST_ID } from '../../model/vitals.types';
import { toggledWeekday } from '../../util/pill.utils';
import { createPill } from '../../util/vitals.factory';
import { WeekdayPickerComponent } from '../../ui/weekday-picker/weekday-picker.component';

type PillForm = {
  name: string;
  dose: number | null;
  time: string;
  weekdays: IsoWeekday[];
  remind: boolean;
  takenToday: boolean;
};

const INVALID_DOSE = { kind: 'invalidDose' } as const;
const NO_WEEKDAY = { kind: 'noWeekday' } as const;

@Component({
  selector: 'app-edit-pill-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-pill-dialog.component.html',
  imports: [
    FormField,
    IonInput,
    IonItem,
    IonNote,
    IonToggle,
    TranslatePipe,
    ItemEditModalComponent,
    WeekdayPickerComponent,
  ],
})
export class EditPillDialogComponent extends BaseEditItemDialog<
  Pill,
  PillForm
> {
  readonly #pills = inject(PillsFacade);
  readonly #profiles = inject(ProfilesFacade);

  protected readonly listId: ItemListId = PILLS_LIST_ID;
  readonly siblings = this.#pills.profilePills;

  readonly doseInvalid = hasErrorKind(this.form.dose, INVALID_DOSE);
  readonly weekdaysInvalid = hasErrorKind(this.form.weekdays, NO_WEEKDAY);

  protected override extraRules(path: SchemaPathTree<PillForm>): void {
    validate(path.dose, ({ value }) => {
      const dose = value();
      return dose === null || dose <= 0 ? INVALID_DOSE : null;
    });
    validate(path.weekdays, ({ value }) =>
      value().length === 0 ? NO_WEEKDAY : null
    );
  }

  protected blank(): Pill {
    return createPill(this.#profiles.routeProfile()?.id ?? '');
  }

  protected override toForm(pill: Pill): PillForm {
    return {
      name: pill.name,
      dose: pill.dose,
      time: clockTime(pill.hour, pill.minute),
      weekdays: [...pill.weekdays],
      remind: pill.remind,
      takenToday: this.#pills.isTakenToday(pill),
    };
  }

  protected override fromForm(draft: PillForm, seed: Pill): Pill {
    const clock = parseClock(draft.time);
    return {
      ...seed,
      name: draft.name,
      dose: draft.dose ?? 1,
      hour: clock?.hour ?? seed.hour,
      minute: clock?.minute ?? seed.minute,
      weekdays: draft.weekdays,
      remind: draft.remind,
    };
  }

  protected save(pill: Pill): void {
    this.#pills.saveItem(pill);
    this.#pills.setTakenToday(pill, this.draft().takenToday);
  }

  toggleWeekday(day: IsoWeekday): void {
    this.patch({ weekdays: toggledWeekday(this.draft().weekdays, day) });
  }
}
