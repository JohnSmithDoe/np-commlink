/* ─── why ─────────────────────────────────────────────────────────
 * The field holds the MANTISSA and the chip holds the magnitude, so typing
 * `2,5` on the Mio chip means 2,5 Millionen rather than 2,50 €. A suffix
 * typed into the field itself — `1,5 mrd` — moves the chip instead of
 * multiplying a second time, which is what a single parse would have done.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  InputCustomEvent,
  IonButton,
  IonInput,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { Language, LOCALE_BY_LANGUAGE } from '../../../@shared/model/app.types';
import { APP_LANGUAGE } from '../../../@shared/util/theme/language.boot';
import {
  MAGNITUDE_CHIPS,
  MAGNITUDE_SCALE_KEYS,
  MAGNITUDE_VALUE,
} from '../../model/magnitude.consts';
import { MagnitudeId } from '../../model/money.types';
import { splitMagnitude } from '../../util/money.utils';

const decimals = (value: number): number =>
  Number.isInteger(value)
    ? 0
    : Math.min(2, String(value).split('.', 2)[1]?.length ?? 0);

const localized = (value: number, language: Language): string =>
  new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    maximumFractionDigits: decimals(value),
  }).format(value);

@Component({
  selector: 'app-magnitude-input',
  templateUrl: './magnitude-input.component.html',
  styleUrl: './magnitude-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonInput, TranslatePipe],
})
export class MagnitudeInputComponent {
  readonly #language = inject(APP_LANGUAGE);

  readonly amount = input.required<number>();
  readonly amountChange = output<number>();

  readonly chips = MAGNITUDE_CHIPS;

  readonly raw = signal('1');
  readonly magnitude = signal<MagnitudeId>('million');

  readonly grouped = computed(() =>
    new Intl.NumberFormat(LOCALE_BY_LANGUAGE[this.#language], {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(this.amount())
  );

  readonly mantissa = computed(() =>
    localized(this.amount() / MAGNITUDE_VALUE[this.magnitude()], this.#language)
  );

  readonly scaleKey = computed(() => {
    const keys = MAGNITUDE_SCALE_KEYS[this.magnitude()];
    const shown = this.amount() / MAGNITUDE_VALUE[this.magnitude()];
    return shown === 1 ? keys.one : keys.many;
  });

  edit(event: InputCustomEvent): void {
    const text = String(event.detail.value ?? '');
    this.raw.set(text);

    const split = splitMagnitude(text, this.#language);
    if (!split) return;

    if (split.magnitude) this.magnitude.set(split.magnitude);
    this.#emit(split.mantissa);
  }

  applyChip(magnitude: MagnitudeId): void {
    const split = splitMagnitude(this.raw(), this.#language);
    this.magnitude.set(magnitude);
    this.#emit(split?.mantissa ?? 1);
  }

  scale(factor: number): void {
    this.amountChange.emit(this.amount() * factor);
  }

  #emit(mantissa: number): void {
    this.amountChange.emit(mantissa * MAGNITUDE_VALUE[this.magnitude()]);
  }
}
