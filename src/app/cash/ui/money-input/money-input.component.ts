import {
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
import { Language } from '../../../@shared/model/app.types';
import { LanguageService } from '../../../@shared/util/theme/language.service';
import { centsToInput, eurToCents } from '../../util/money.utils';

export const NOT_AN_AMOUNT = { kind: 'notAnAmount' } as const;

export function parseAmount(
  raw: string,
  language: Language = 'de'
): ParseResult<number | null> {
  if (raw.trim() === '') return { value: null };
  const cents = eurToCents(raw, language);
  return cents === null ? { error: NOT_AN_AMOUNT } : { value: cents };
}

@Component({
  selector: 'app-money-input',
  templateUrl: './money-input.component.html',
  imports: [IonItem, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoneyInputComponent implements FormValueControl<number | null> {
  readonly value = model<number | null>(null);
  readonly label = input<string>();

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
