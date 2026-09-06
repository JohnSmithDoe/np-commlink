import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_LANGUAGE } from '../../../@shared/util/theme/language.boot';
import { MONEY_LADDERS } from '../../model/money.catalog';
import { DerivedUnit } from '../../model/money.types';
import { MoneyRow } from '../../util/money.utils';
import { formatNumber, humanize } from '../../util/convert.utils';

@Component({
  selector: 'app-money-row',
  templateUrl: './money-row.component.html',
  styleUrl: './money-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class MoneyRowComponent {
  readonly #language = inject(APP_LANGUAGE);

  readonly row = input.required<MoneyRow>();

  readonly headline = computed(() =>
    formatNumber(this.row().value, this.#language)
  );

  readonly basisParams = computed(() => {
    const { reference, count } = this.row();
    return {
      rate: formatNumber(reference.rate, this.#language),
      year: reference.year ?? '',
      count: formatNumber(count, this.#language),
    };
  });

  readonly anchorParams = computed(() => {
    const found = this.row().anchor;
    if (!found) return null;

    const ladder = MONEY_LADDERS[found.anchor.family as DerivedUnit];
    const measured = ladder
      ? humanize(found.anchor.value, ladder)
      : { value: found.anchor.value, unit: undefined };

    const size = formatNumber(measured.value, this.#language);

    return {
      multiple: formatNumber(found.multiple, this.#language),
      value: measured.unit ? `${size} ${measured.unit.symbol}` : size,
    };
  });
}
