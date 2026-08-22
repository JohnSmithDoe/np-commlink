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
import { APP_LANGUAGE } from '../../../@shared/util/theme/language.boot';
import { gramsToInput, inputToGrams } from '../../util/weight.utils';

const NOT_A_WEIGHT = { kind: 'notAWeight' } as const;

function parseWeight(raw: string): ParseResult<number | null> {
  if (raw.trim() === '') return { value: null };
  const grams = inputToGrams(raw);
  return grams === null ? { error: NOT_A_WEIGHT } : { value: grams };
}

@Component({
  selector: 'app-weight-input',
  templateUrl: './weight-input.component.html',
  imports: [IonItem, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeightInputComponent implements FormValueControl<number | null> {
  readonly value = model<number | null>(null);
  readonly label = input<string>();

  readonly touchedChange = output<boolean>();

  readonly #language = inject(APP_LANGUAGE);

  protected readonly raw = transformedValue(this.value, {
    parse: (raw: string) => parseWeight(raw),
    format: (grams: number | null) => gramsToInput(grams, this.#language),
  });

  protected onInput(event: InputCustomEvent): void {
    this.raw.set(String(event.detail.value ?? ''));
  }
}
