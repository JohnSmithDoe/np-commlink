import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import {
  FormValueControl,
  ParseResult,
  transformedValue,
} from '@angular/forms/signals';
import { InputCustomEvent, IonInput, IonItem } from '@ionic/angular/standalone';
import { TLanguage } from '../../../@shared/model/app.types';
import { LanguageService } from '../../../@shared/util/language.service';
import { centsToInput, eurToCents } from '../../util/money.utils';

/** What the field reports while the box holds something that is not an amount. */
export const NOT_AN_AMOUNT = { kind: 'notAnAmount' } as const;

/** What the box accepts — the control's contract, hence exported and spec'd. */
export function parseAmount(
  raw: string,
  language: TLanguage = 'de'
): ParseResult<number | null> {
  if (raw.trim() === '') return { value: null };
  const cents = eurToCents(raw, language);
  // No `value` on a parse failure, so the model keeps the last amount that
  // parsed — the error alone is what the field reads.
  return cents === null ? { error: NOT_AN_AMOUNT } : { value: cents };
}

/**
 * A euro amount as a Signal Forms control over **integer cents**, so a dialog
 * binds `[formField]="form.amountCents"` and never carries the amount as a
 * de-DE string it has to re-parse. `transformedValue` owns both directions:
 * cents → the plain `12,34` a user edits, and back. The box is only reformatted
 * when the model changes from outside (a reseed), never mid-keystroke.
 *
 * What the caller gets for free: an unparseable box reports {@link NOT_AN_AMOUNT}
 * to the bound field — so `min()` and the rest of the built-in validators become
 * usable on the cents, and "did that parse" stops being the dialog's problem.
 */
@Component({
  selector: 'app-money-input',
  templateUrl: './money-input.component.html',
  imports: [IonItem, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoneyInputComponent implements FormValueControl<number | null> {
  readonly value = model<number | null>(null);
  readonly label = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Blur marks the bound field touched. An output of exactly this name is the
   * only channel Angular offers a custom control for it
   * (`listenToCustomControlOutput('touchedChange')`) — without it the field's
   * `touched` never turns true, however long the box was edited.
   */
  readonly touchedChange = output<boolean>();

  readonly #language = inject(LanguageService).language;

  protected readonly raw = transformedValue(this.value, {
    parse: (raw: string) => parseAmount(raw, this.#language()),
    format: (cents: number | null) =>
      cents === null ? '' : centsToInput(cents, this.#language()),
  });

  protected onInput(event: InputCustomEvent): void {
    this.raw.set(String(event.detail.value ?? ''));
  }
}
