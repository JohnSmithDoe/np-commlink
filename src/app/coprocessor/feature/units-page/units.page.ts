import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  InputCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { swapHorizontalOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { APP_LANGUAGE } from '../../../@shared/util/theme/language.boot';
import { MONEY_GROUPS } from '../../model/money.catalog';
import { QUANTITIES, QUANTITY_BY_ID } from '../../model/units.catalog';
import { QuantityId } from '../../model/units.types';
import { MagnitudeInputComponent } from '../../ui/magnitude-input/magnitude-input.component';
import { MoneyRowComponent } from '../../ui/money-row/money-row.component';
import { convert, formatNumber } from '../../util/convert.utils';
import { referenceResults } from '../../util/money.utils';

type UnitsMode = 'units' | 'money';

@Component({
  selector: 'app-page-coprocessor-units',
  templateUrl: './units.page.html',
  styleUrl: './units.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MagnitudeInputComponent,
    MoneyRowComponent,
    PageHeaderComponent,
    PageReturnComponent,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
  ],
})
export class CoprocessorUnitsPage {
  readonly #language = inject(APP_LANGUAGE);

  readonly quantities = QUANTITIES;
  readonly groups = MONEY_GROUPS;

  readonly mode = signal<UnitsMode>('units');

  readonly quantityId = signal<QuantityId>('length');
  readonly quantity = computed(() => QUANTITY_BY_ID[this.quantityId()]);

  readonly fromId = signal(QUANTITY_BY_ID['length'].defaultFrom);
  readonly toId = signal(QUANTITY_BY_ID['length'].defaultTo);
  readonly amount = signal(1);

  readonly fromUnit = computed(
    () => this.#unit(this.fromId()) ?? this.quantity().units[0]!
  );
  readonly toUnit = computed(
    () => this.#unit(this.toId()) ?? this.quantity().units[0]!
  );

  readonly converted = computed(() =>
    formatNumber(
      convert(this.amount(), this.fromUnit(), this.toUnit()),
      this.#language
    )
  );

  readonly inverse = computed(() =>
    formatNumber(convert(1, this.toUnit(), this.fromUnit()), this.#language)
  );

  readonly money = signal(1_000_000);
  readonly rows = computed(() => referenceResults(this.money()));

  constructor() {
    addIcons({ swapHorizontalOutline });
  }

  selectMode(mode: string | undefined): void {
    if (mode === 'units' || mode === 'money') this.mode.set(mode);
  }

  selectQuantity(id: QuantityId): void {
    const quantity = QUANTITY_BY_ID[id];
    this.quantityId.set(id);
    this.fromId.set(quantity.defaultFrom);
    this.toId.set(quantity.defaultTo);
  }

  editAmount(event: InputCustomEvent): void {
    const parsed = Number(String(event.detail.value ?? '').replace(',', '.'));
    if (Number.isFinite(parsed)) this.amount.set(parsed);
  }

  swap(): void {
    const from = this.fromId();
    this.fromId.set(this.toId());
    this.toId.set(from);
  }

  rowsIn(group: string) {
    return this.rows().filter((row) => row.reference.group === group);
  }

  #unit(id: string) {
    return this.quantity().units.find((candidate) => candidate.id === id);
  }
}
