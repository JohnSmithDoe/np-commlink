/* ─── why ─────────────────────────────────────────────────────────
 * A scaled-integer field is a formatted STRING in the DOM and an integer in
 * the model, and `transformedValue` plus the blur-to-touched wiring is the
 * same for every one of them. Only the conversion pair differs, and it stays
 * with the domain that owns the unit: cents parse a currency with group
 * separators, grams accept a `kg` suffix and round to 100 g.
 *
 * `@Directive()` and not a plain base class, because `value`, `label` and
 * `touchedChange` have to be inherited as real inputs and outputs — an
 * undecorated base declares fields the compiler will not bind.
 * ───────────────────────────────────────────────────────────────── */
import { Directive, inject, input, model, output } from '@angular/core';
import {
  FormValueControl,
  ParseResult,
  transformedValue,
} from '@angular/forms/signals';
import { InputCustomEvent } from '@ionic/angular/standalone';
import { Language } from '../../model/app.types';
import { APP_LANGUAGE } from '../../util/theme/language.boot';

@Directive()
export abstract class BaseDecimalInput implements FormValueControl<
  number | null
> {
  readonly value = model<number | null>(null);
  readonly label = input<string>();

  readonly touchedChange = output<boolean>();

  protected readonly language = inject(APP_LANGUAGE);

  protected abstract parse(
    raw: string,
    language: Language
  ): ParseResult<number | null>;

  protected abstract format(value: number | null, language: Language): string;

  protected readonly raw = transformedValue(this.value, {
    parse: (raw: string) => this.parse(raw, this.language),
    format: (value: number | null) => this.format(value, this.language),
  });

  protected onInput(event: InputCustomEvent): void {
    this.raw.set(String(event.detail.value ?? ''));
  }
}
