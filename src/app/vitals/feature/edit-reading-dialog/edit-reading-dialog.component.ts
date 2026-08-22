/* ─── why ─────────────────────────────────────────────────────────
 * The holder picker and the combined field are NOT part of the form. They
 * are a calculator: whenever both numbers are known they write the
 * difference into the weight field, and nothing about them is stored or
 * re-derived later. A pet's reading is one number, indistinguishable from
 * a typed one — which is what lets either side be corrected afterwards
 * without a stale link to answer for.
 *
 * The suggested holder weight is that person's nearest reading AT OR
 * BEFORE the date being recorded: back-dating a reading must not subtract
 * a body weight from a later day. Which is why the difference is recomputed
 * from an effect and not only from the three setters — the date has no
 * setter, it is typed straight into the form, and a suggestion that moves
 * under a difference already written leaves three numbers that do not add up.
 *
 * A single person profile IS the answer to "who is holding the cat", so
 * the picker starts on them. It stays empty from two onwards, where
 * guessing would be picking one of two right answers.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  untracked,
} from '@angular/core';
import { FormField, SchemaPathTree, validate } from '@angular/forms/signals';
import {
  IonInput,
  IonItem,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  SelectCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import {
  DUPLICATE_NAME,
  hasErrorKind,
  requireParseableDate,
} from '../../../@shared/util/forms/form-rules';
import { ProfilesFacade, ReadingsFacade } from '../../data';
import { Reading, READINGS_LIST_ID, VitalsId } from '../../model/vitals.types';
import { createReading } from '../../util/vitals.factory';
import { isoDay } from '../../../@shared/util/formatting/date-format.utils';
import { nearestReadingUpTo } from '../../util/vitals.utils';
import { WeightInputComponent } from '../../ui/weight-input/weight-input.component';

type ReadingForm = {
  name: string;
  grams: number | null;
};

const MISSING_WEIGHT = { kind: 'missingWeight' } as const;

@Component({
  selector: 'app-edit-reading-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-reading-dialog.component.html',
  imports: [
    FormField,
    IonInput,
    IonItem,
    IonListHeader,
    IonNote,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
    ItemEditModalComponent,
    WeightInputComponent,
  ],
})
export class EditReadingDialogComponent extends BaseEditItemDialog<
  Reading,
  ReadingForm
> {
  readonly #readings = inject(ReadingsFacade);
  readonly #profiles = inject(ProfilesFacade);

  protected readonly listId: ItemListId = READINGS_LIST_ID;
  readonly siblings = this.#readings.profileReadings;

  readonly holders = this.#profiles.persons;

  readonly holderId = linkedSignal({
    source: this.seedItem,
    computation: (): VitalsId => {
      const holders = this.holders();
      return holders.length === 1 ? (holders[0]?.id ?? '') : '';
    },
  });

  readonly combinedGrams = linkedSignal({
    source: this.seedItem,
    computation: (): number | null => null,
  });

  readonly #suggestedHolderGrams = computed((): number | null => {
    const holderId = this.holderId();
    if (!holderId) return null;
    const on = isoDay(this.draft().name);
    return (
      nearestReadingUpTo(this.#readings.allItems(), holderId, on)?.grams ?? null
    );
  });

  readonly holderGrams = linkedSignal(() => this.#suggestedHolderGrams());

  constructor() {
    super();
    effect(() => {
      this.#suggestedHolderGrams();
      untracked(() => this.#applyDifference());
    });
  }

  readonly showCalculator = computed(
    () => this.isCreateMode() && this.#profiles.routeProfile()?.type === 'pet'
  );

  readonly dateTaken = hasErrorKind(this.form.name, DUPLICATE_NAME);

  protected override extraRules(path: SchemaPathTree<ReadingForm>): void {
    requireParseableDate(path.name);
    validate(path.grams, ({ value }) =>
      value() === null ? MISSING_WEIGHT : null
    );
  }

  protected blank(): Reading {
    return createReading('');
  }

  protected override toForm(reading: Reading): ReadingForm {
    return { name: reading.name, grams: reading.grams || null };
  }

  protected override fromForm(draft: ReadingForm, seed: Reading): Reading {
    return {
      ...seed,
      name: isoDay(draft.name),
      grams: draft.grams ?? 0,
    };
  }

  protected save(item: Reading): void {
    this.#readings.saveItem(item);
  }

  setHolder(event: SelectCustomEvent<VitalsId>): void {
    this.holderId.set(event.detail.value);
    this.#applyDifference();
  }

  setHolderGrams(grams: number | null): void {
    this.holderGrams.set(grams);
    this.#applyDifference();
  }

  setCombinedGrams(grams: number | null): void {
    this.combinedGrams.set(grams);
    this.#applyDifference();
  }

  #applyDifference(): void {
    const holder = this.holderGrams();
    const combined = this.combinedGrams();
    if (holder === null || combined === null) return;
    this.patch({ grams: combined - holder });
  }
}
