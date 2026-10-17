import { Component, computed, inject, signal } from '@angular/core';
import {
  IonContent,
  IonInput,
  InputCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { APP_LANGUAGE } from '../../../@shared/util/theme/language.boot';
import { CALC_ERROR_KEYS, CALC_KEYS } from '../../model/calc.consts';
import { CalcKey } from '../../model/calc.types';
import { KeypadComponent } from '../../ui/keypad/keypad.component';
import { formatNumber } from '../../util/convert.utils';
import { evaluateExpression } from '../../util/expression.utils';

@Component({
  selector: 'app-page-coprocessor-calc',
  templateUrl: './calc.page.html',
  styleUrl: './calc.page.scss',
  imports: [
    KeypadComponent,
    PageHeaderComponent,
    PageReturnComponent,
    IonContent,
    IonInput,
    TranslatePipe,
  ],
})
export class CoprocessorCalcPage {
  readonly #language = inject(APP_LANGUAGE);

  readonly #result = computed(() => evaluateExpression(this.expression()));

  readonly keys = CALC_KEYS;
  readonly expression = signal('');

  readonly value = computed(() => {
    const result = this.#result();
    return result.ok ? formatNumber(result.value, this.#language) : null;
  });

  readonly errorKey = computed(() => {
    const result = this.#result();
    return result.ok ||
      result.reason === 'empty' ||
      result.reason === 'incomplete'
      ? null
      : CALC_ERROR_KEYS[result.reason];
  });

  readonly canCommit = computed(() => this.#result().ok);

  private commit(): void {
    const result = this.#result();
    if (!result.ok) return;
    this.expression.set(formatNumber(result.value, this.#language));
  }

  press(key: CalcKey): void {
    if (key.emit === 'clear') {
      this.expression.set('');
      return;
    }
    if (key.emit === 'back') {
      this.expression.update((current) => current.slice(0, -1));
      return;
    }
    if (key.emit === 'equals') {
      this.commit();
      return;
    }
    this.expression.update((current) => current + key.emit);
  }

  edit(event: InputCustomEvent): void {
    this.expression.set(event.detail.value ?? '');
  }
}
