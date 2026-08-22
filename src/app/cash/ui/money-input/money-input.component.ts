import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParseResult } from '@angular/forms/signals';
import { IonInput, IonItem } from '@ionic/angular/standalone';
import { Language } from '../../../@shared/model/app.types';
import { BaseDecimalInput } from '../../../@shared/ui/forms/base-decimal-input';
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
export class MoneyInputComponent extends BaseDecimalInput {
  protected parse(raw: string, language: Language): ParseResult<number | null> {
    return parseAmount(raw, language);
  }

  protected format(cents: number | null, language: Language): string {
    return cents === null ? '' : centsToInput(cents, language);
  }
}
