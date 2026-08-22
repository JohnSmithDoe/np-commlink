import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParseResult } from '@angular/forms/signals';
import { IonInput, IonItem } from '@ionic/angular/standalone';
import { Language } from '../../../@shared/model/app.types';
import { BaseDecimalInput } from '../../../@shared/ui/forms/base-decimal-input';
import { gramsToInput, inputToGrams } from '../../util/weight.utils';

const NOT_A_WEIGHT = { kind: 'notAWeight' } as const;

@Component({
  selector: 'app-weight-input',
  templateUrl: './weight-input.component.html',
  imports: [IonItem, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeightInputComponent extends BaseDecimalInput {
  protected parse(raw: string): ParseResult<number | null> {
    if (raw.trim() === '') return { value: null };
    const grams = inputToGrams(raw);
    return grams === null ? { error: NOT_A_WEIGHT } : { value: grams };
  }

  protected format(grams: number | null, language: Language): string {
    return gramsToInput(grams, language);
  }
}
